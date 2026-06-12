// ChunkMesher: culled-face meshing. Emits one opaque and one transparent
// (water) BufferGeometry per chunk, with per-face directional shading baked
// into vertex colours — the classic flat-lit Minecraft look, no scene lights.
import * as THREE from "three";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "./Chunk";
import { AIR, BLOCKS, WATER, isOpaque } from "./Block";
import { tileUV } from "./TextureAtlas";

export interface ChunkMaterials {
  solid: THREE.Material;
  water: THREE.Material;
}

/** Minimal world view the mesher needs — lets it sample across chunk borders. */
export interface BlockSource {
  getBlock(wx: number, wy: number, wz: number): number;
}

interface FaceSpec {
  dir: [number, number, number];
  /** Corner offsets, counter-clockwise seen from outside, bottom edge first. */
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
  private normals: number[] = [];
  private uvs: number[] = [];
  private colors: number[] = [];
  private indices: number[] = [];

  quad(x: number, y: number, z: number, face: FaceSpec, tiles: [number, number, number]): void {
    const tile = face.dir[1] === 1 ? tiles[0] : face.dir[1] === -1 ? tiles[2] : tiles[1];
    const [u0, v0, u1, v1] = tileUV(tile);
    const uvCorners = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    const base = this.positions.length / 3;
    for (let i = 0; i < 4; i++) {
      const c = face.corners[i];
      this.positions.push(x + c[0], y + c[1], z + c[2]);
      this.normals.push(face.dir[0], face.dir[1], face.dir[2]);
      this.uvs.push(uvCorners[i][0], uvCorners[i][1]);
      this.colors.push(face.shade, face.shade, face.shade);
    }
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  build(): THREE.BufferGeometry | null {
    if (this.indices.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    g.setIndex(this.indices);
    return g;
  }
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
        const isWater = id === WATER;
        const builder = isWater ? waterBuilder : solidBuilder;

        for (const face of FACES) {
          const nb = source.getBlock(
            baseX + x + face.dir[0],
            y + face.dir[1],
            baseZ + z + face.dir[2],
          );
          // Opaque blocks face anything see-through; water only faces air
          // (solid neighbours already draw the shared boundary themselves).
          const visible = isWater ? nb === AIR : !isOpaque(nb);
          if (visible) builder.quad(baseX + x, y, baseZ + z, face, BLOCKS[id].tiles);
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
