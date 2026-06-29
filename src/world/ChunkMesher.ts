// ChunkMesher: greedy meshing for opaque solid blocks (coplanar same-tile,
// same-light faces merge into one quad), with a per-face path kept for water,
// cutout blocks (glass/leaves), and torches. Per-face directional shade and the
// sampled skylight/blocklight are baked in; the atlas tile window travels with
// each vertex so the shader can repeat it across a merged quad.
import * as THREE from "three";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "./Chunk";
import { AIR, BLOCKS, TORCH, isOpaque, meshLayer } from "./Block";
import { tileUV } from "./TextureAtlas";
import { greedyRects } from "./greedy";

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

// For a face axis a, the other two axes used as the greedy mask's u and v.
const UV_AXIS: [number, number][] = [[1, 2], [0, 2], [0, 1]];

class GeometryBuilder {
  private positions: number[] = [];
  private uvs: number[] = [];
  private tiles: number[] = [];
  private colors: number[] = [];
  private lights: number[] = [];
  private indices: number[] = [];

  // Low-level quad: 4 vertices (positions[12], tiled uv[8]) sharing a tile
  // window, directional shade, and flat light.
  pushQuad(p: number[], uv: number[], tile: readonly [number, number, number, number], shade: number, sky: number, block: number): void {
    const base = this.positions.length / 3;
    for (let i = 0; i < 4; i++) {
      this.positions.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
      this.uvs.push(uv[i * 2], uv[i * 2 + 1]);
      this.tiles.push(tile[0], tile[1], tile[2], tile[3]);
      this.colors.push(shade, shade, shade);
      this.lights.push(sky / 15, block / 15);
    }
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // A single unit-cell quad (per-face path: water/cutout/torch).
  quad(
    ox: number, oy: number, oz: number,
    min: [number, number, number], max: [number, number, number],
    face: FaceSpec, tile: number, sky: number, block: number,
  ): void {
    const uvUnit = [0, 0, 1, 0, 1, 1, 0, 1];
    const p: number[] = [];
    for (let i = 0; i < 4; i++) {
      const c = face.corners[i];
      p.push(ox + (c[0] ? max[0] : min[0]), oy + (c[1] ? max[1] : min[1]), oz + (c[2] ? max[2] : min[2]));
    }
    this.pushQuad(p, uvUnit, tileUV(tile), face.shade, sky, block);
  }

  build(): THREE.BufferGeometry | null {
    if (this.indices.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setAttribute("aTile", new THREE.Float32BufferAttribute(this.tiles, 4));
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

// Opaque solid blocks take the greedy path; water/cutout/torch take per-face.
function isGreedy(id: number): boolean {
  const b = BLOCKS[id];
  return id !== AIR && id !== TORCH && b.solid && b.opaque && meshLayer(id) === "solid";
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

  // Per-face path for the special blocks (greedy blocks handled below).
  for (let y = 0; y < CHUNK_Y; y++) {
    for (let z = 0; z < CHUNK_Z; z++) {
      for (let x = 0; x < CHUNK_X; x++) {
        const id = chunk.get(x, y, z);
        if (id === AIR) continue;
        const wx = baseX + x;
        const wz = baseZ + z;

        if (id === TORCH) { emitTorch(solidBuilder, source, wx, y, wz); continue; }
        if (isGreedy(id)) continue;

        const isWater = meshLayer(id) === "water";
        const builder = isWater ? waterBuilder : solidBuilder;
        for (const face of FACES) {
          const nx = wx + face.dir[0];
          const ny = y + face.dir[1];
          const nz = wz + face.dir[2];
          const nb = source.getBlock(nx, ny, nz);
          const visible = isWater ? nb === AIR : !isOpaque(nb) && nb !== id;
          if (!visible) continue;
          const l = source.getLight(nx, ny, nz);
          builder.quad(wx, y, wz, CUBE_MIN, CUBE_MAX, face, tileFor(id, face.dir), l.sky, l.block);
        }
      }
    }
  }

  greedyPass(source, chunk, solidBuilder);

  const solidGeo = solidBuilder.build();
  const waterGeo = waterBuilder.build();
  return {
    solid: solidGeo ? new THREE.Mesh(solidGeo, materials.solid) : null,
    water: waterGeo ? new THREE.Mesh(waterGeo, materials.water) : null,
  };
}

// Greedy-merge each face direction layer by layer.
function greedyPass(source: BlockSource, chunk: Chunk, builder: GeometryBuilder): void {
  const baseX = chunk.cx * CHUNK_X;
  const baseZ = chunk.cz * CHUNK_Z;
  const dim = [CHUNK_X, CHUNK_Y, CHUNK_Z];
  const c = [0, 0, 0];

  for (const face of FACES) {
    const a = face.dir[0] !== 0 ? 0 : face.dir[1] !== 0 ? 1 : 2;
    const s = face.dir[a];
    const [au, av] = UV_AXIS[a];
    const U = dim[au];
    const V = dim[av];
    const A = dim[a];
    const mask = new Int32Array(U * V);

    for (let la = 0; la < A; la++) {
      mask.fill(0);
      for (let vv = 0; vv < V; vv++) {
        for (let uu = 0; uu < U; uu++) {
          c[a] = la; c[au] = uu; c[av] = vv;
          const id = chunk.get(c[0], c[1], c[2]);
          if (!isGreedy(id)) continue;
          const nx = baseX + c[0] + face.dir[0];
          const ny = c[1] + face.dir[1];
          const nz = baseZ + c[2] + face.dir[2];
          const nb = source.getBlock(nx, ny, nz);
          if (isOpaque(nb) || nb === id) continue;
          const l = source.getLight(nx, ny, nz);
          const tile = tileFor(id, face.dir);
          mask[uu + vv * U] = ((tile << 8) | (l.sky << 4) | l.block) + 1;
        }
      }

      const rects = greedyRects(mask, U, V);
      if (rects.length === 0) continue;
      const faceA = la + (s > 0 ? 1 : 0);
      for (const r of rects) {
        const k = r.key - 1;
        const block = k & 15;
        const sky = (k >> 4) & 15;
        const tile = k >> 8;
        const u0 = r.u, u1 = r.u + r.w, v0 = r.v, v1 = r.v + r.h;
        const p: number[] = [];
        const uv: number[] = [];
        for (const corner of face.corners) {
          const cc = [0, 0, 0];
          cc[a] = faceA;
          cc[au] = corner[au] ? u1 : u0;
          cc[av] = corner[av] ? v1 : v0;
          p.push(baseX + cc[0], cc[1], baseZ + cc[2]);
          uv.push(corner[au] ? r.w : 0, corner[av] ? r.h : 0);
        }
        builder.pushQuad(p, uv, tileUV(tile), face.shade, sky, block);
      }
    }
  }
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
