// ChunkMesher: culled-face meshing. Emits one opaque and one water
// BufferGeometry per chunk. Per-face directional shading is baked into vertex
// colours; per-vertex skylight/blocklight (sampled from the neighbour the face
// faces) is baked into an `aLight` attribute the ChunkMaterial reads.
import * as THREE from "three";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "./Chunk";
import { AIR, BLOCKS, TORCH, isOpaque, meshLayer } from "./Block";
import { tileUV } from "./TextureAtlas";

export interface ChunkMaterials {
  solid: THREE.Material;
  water: THREE.Material;
}

/** Minimal world view the mesher needs — block ids and light across borders. */
export interface BlockSource {
  getBlock(wx: number, wy: number, wz: number): number;
  getLight(wx: number, wy: number, wz: number): { sky: number; block: number };
}

interface FaceSpec {
  dir: [number, number, number];
  /** Corner offsets (0/1 per axis), counter-clockwise from outside. */
  corners: [number, number, number][];
  shade: number;
}

const FACES: FaceSpec[] = [
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.6 },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.6 },
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5 },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.8 },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.8 },
];

class GeometryBuilder {
  private positions: number[] = [];
  private uvs: number[] = [];
  private colors: number[] = [];
  private lights: number[] = [];
  private indices: number[] = [];

  // A single quad of an axis-aligned box spanning [min,max] within the cell.
  quad(
    ox: number, oy: number, oz: number,
    min: [number, number, number], max: [number, number, number],
    face: FaceSpec, tile: number, sky: number, block: number,
  ): void {
    const [u0, v0, u1, v1] = tileUV(tile);
    const uvCorners = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    const base = this.positions.length / 3;
    for (let i = 0; i < 4; i++) {
      const c = face.corners[i];
      this.positions.push(
        ox + (c[0] ? max[0] : min[0]),
        oy + (c[1] ? max[1] : min[1]),
        oz + (c[2] ? max[2] : min[2]),
      );
      this.uvs.push(uvCorners[i][0], uvCorners[i][1]);
      this.colors.push(face.shade, face.shade, face.shade);
      this.lights.push(sky / 15, block / 15);
    }
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  build(): THREE.BufferGeometry | null {
    if (this.indices.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    g.setAttribute("aLight", new THREE.Float32BufferAttribute(this.lights, 2));
    g.setIndex(this.indices);
    return g;
  }
}

const CUBE_MIN: [number, number, number] = [0, 0, 0];
const CUBE_MAX: [number, number, number] = [1, 1, 1];

function tileFor(id: number, dir: [number, number, number]): number {
  const t = BLOCKS[id].tiles;
  return dir[1] === 1 ? t[0] : dir[1] === -1 ? t[2] : t[1];
}

export function meshChunk(
  source: BlockSource,
  chunk: Chunk,
  materials: ChunkMaterials,
): { solid: THREE.Mesh | null; water: THREE.Mesh | null } {
  const solidBuilder = new GeometryBuilder();
  const waterBuilder = new GeometryBuilder();
  const baseX = chunk.cx * CHUNK_X;
  const baseZ = chunk.cz * CHUNK_Z;

  for (let y = 0; y < CHUNK_Y; y++) {
    for (let z = 0; z < CHUNK_Z; z++) {
      for (let x = 0; x < CHUNK_X; x++) {
        const id = chunk.get(x, y, z);
        if (id === AIR) continue;
        const wx = baseX + x;
        const wz = baseZ + z;

        if (id === TORCH) {
          emitTorch(solidBuilder, source, wx, y, wz);
          continue;
        }

        const isWater = meshLayer(id) === "water";
        const builder = isWater ? waterBuilder : solidBuilder;

        for (const face of FACES) {
          const nx = wx + face.dir[0];
          const ny = y + face.dir[1];
          const nz = wz + face.dir[2];
          const nb = source.getBlock(nx, ny, nz);
          // Water faces air only; everything else faces any non-opaque
          // neighbour, skipping same-id boundaries (adjacent leaves/glass).
          const visible = isWater ? nb === AIR : !isOpaque(nb) && nb !== id;
          if (!visible) continue;
          const l = source.getLight(nx, ny, nz);
          builder.quad(wx, y, wz, CUBE_MIN, CUBE_MAX, face, tileFor(id, face.dir), l.sky, l.block);
        }
      }
    }
  }

  const solidGeo = solidBuilder.build();
  const waterGeo = waterBuilder.build();
  return {
    solid: solidGeo ? new THREE.Mesh(solidGeo, materials.solid) : null,
    water: waterGeo ? new THREE.Mesh(waterGeo, materials.water) : null,
  };
}

// A torch renders as a thin emissive pillar, lit by its own cell's light.
function emitTorch(builder: GeometryBuilder, source: BlockSource, wx: number, wy: number, wz: number): void {
  const min: [number, number, number] = [0.42, 0, 0.42];
  const max: [number, number, number] = [0.58, 0.62, 0.58];
  const l = source.getLight(wx, wy, wz);
  for (const face of FACES) {
    builder.quad(wx, wy, wz, min, max, face, 19 /* torch tile */, l.sky, Math.max(l.block, 14));
  }
}
