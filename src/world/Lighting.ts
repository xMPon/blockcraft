// Lighting: per-chunk skylight + blocklight via BFS flood-fill. Pure of three.js
// and the DOM so it runs under vitest. Light is computed one chunk at a time;
// border cells pull from already-lit neighbours so light bleeds across chunks.
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "./Chunk";
import { isOpaque, lightEmission } from "./Block";

/** What Lighting needs from the world to sample across chunk borders. */
export interface LightWorld {
  getBlock(wx: number, wy: number, wz: number): number;
  getLight(wx: number, wy: number, wz: number): { sky: number; block: number };
}

// Pack local coords (x,z ∈ [0,16), y ∈ [0,128)) into one int for the BFS queue.
const KEY = (x: number, y: number, z: number) => (y << 8) | (z << 4) | x;
const KX = (k: number) => k & 15;
const KZ = (k: number) => (k >> 4) & 15;
const KY = (k: number) => (k >> 8) & 255;

export function computeLight(world: LightWorld, chunk: Chunk): void {
  const sky = chunk.skyLight;
  const block = chunk.blockLight;
  sky.fill(0);
  block.fill(0);
  const baseX = chunk.cx * CHUNK_X;
  const baseZ = chunk.cz * CHUNK_Z;

  // Skylight: each column is full strength from the top down until it meets an
  // opaque block; everything below stays dark unless BFS spreads light in.
  const skyQueue: number[] = [];
  for (let x = 0; x < CHUNK_X; x++) {
    for (let z = 0; z < CHUNK_Z; z++) {
      let level = 15;
      for (let y = CHUNK_Y - 1; y >= 0; y--) {
        if (isOpaque(chunk.get(x, y, z))) level = 0;
        if (level > 0) {
          sky[Chunk.index(x, y, z)] = level;
          skyQueue.push(KEY(x, y, z));
        }
      }
    }
  }
  seedBorders(world, chunk, sky, true, skyQueue, baseX, baseZ);
  propagate(chunk, sky, skyQueue);

  // Blocklight: BFS out from every emitter (torches, lava).
  const blockQueue: number[] = [];
  for (let x = 0; x < CHUNK_X; x++) {
    for (let y = 0; y < CHUNK_Y; y++) {
      for (let z = 0; z < CHUNK_Z; z++) {
        const e = lightEmission(chunk.get(x, y, z));
        if (e > 0) {
          block[Chunk.index(x, y, z)] = e;
          blockQueue.push(KEY(x, y, z));
        }
      }
    }
  }
  seedBorders(world, chunk, block, false, blockQueue, baseX, baseZ);
  propagate(chunk, block, blockQueue);
}

// Pull light into the four side planes from neighbouring chunks (attenuated 1).
function seedBorders(
  world: LightWorld, chunk: Chunk, arr: Uint8Array, isSky: boolean,
  queue: number[], baseX: number, baseZ: number,
): void {
  const read = (wx: number, wy: number, wz: number) => {
    const l = world.getLight(wx, wy, wz);
    return isSky ? l.sky : l.block;
  };
  const trySet = (lx: number, ly: number, lz: number, neighbour: number) => {
    if (neighbour <= 1 || isOpaque(chunk.get(lx, ly, lz))) return;
    const i = Chunk.index(lx, ly, lz);
    if (arr[i] < neighbour - 1) {
      arr[i] = neighbour - 1;
      queue.push(KEY(lx, ly, lz));
    }
  };
  for (let y = 0; y < CHUNK_Y; y++) {
    for (let z = 0; z < CHUNK_Z; z++) {
      trySet(0, y, z, read(baseX - 1, y, baseZ + z));
      trySet(CHUNK_X - 1, y, z, read(baseX + CHUNK_X, y, baseZ + z));
    }
    for (let x = 0; x < CHUNK_X; x++) {
      trySet(x, y, 0, read(baseX + x, y, baseZ - 1));
      trySet(x, y, CHUNK_Z - 1, read(baseX + x, y, baseZ + CHUNK_Z));
    }
  }
}

// Standard light BFS within one chunk: spread to non-opaque neighbours at level-1.
function propagate(chunk: Chunk, arr: Uint8Array, queue: number[]): void {
  let head = 0;
  while (head < queue.length) {
    const k = queue[head++];
    const x = KX(k), y = KY(k), z = KZ(k);
    const level = arr[Chunk.index(x, y, z)];
    if (level <= 1) continue;
    const step = (nx: number, ny: number, nz: number) => {
      if (nx < 0 || nx >= CHUNK_X || ny < 0 || ny >= CHUNK_Y || nz < 0 || nz >= CHUNK_Z) return;
      if (isOpaque(chunk.get(nx, ny, nz))) return;
      const ni = Chunk.index(nx, ny, nz);
      if (arr[ni] < level - 1) {
        arr[ni] = level - 1;
        queue.push(KEY(nx, ny, nz));
      }
    };
    step(x + 1, y, z); step(x - 1, y, z);
    step(x, y + 1, z); step(x, y - 1, z);
    step(x, y, z + 1); step(x, y, z - 1);
  }
}
