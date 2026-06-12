// WorldGen: deterministic noise terrain — stone/dirt/grass layers, sand
// beaches, sea-level water, and trees. Same seed always yields the same world.
import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "./Chunk";
import { DIRT, GRASS, LEAVES, SAND, STONE, WATER, WOOD } from "./Block";
import { hash01, mulberry32 } from "../core/rng";

export const SEA_LEVEL = 22;

export class WorldGen {
  private readonly noise: NoiseFunction2D;

  constructor(readonly seed: number) {
    this.noise = createNoise2D(mulberry32(seed));
  }

  /** Terrain surface height (top solid block) for any world column. */
  heightAt(wx: number, wz: number): number {
    const n =
      this.noise(wx / 140, wz / 140) * 13 +
      this.noise(wx / 47 + 512, wz / 47 - 512) * 5 +
      this.noise(wx / 16 - 256, wz / 16 + 256) * 2;
    const h = Math.floor(24 + n);
    return Math.max(1, Math.min(CHUNK_Y - 12, h));
  }

  generate(chunk: Chunk): void {
    const baseX = chunk.cx * CHUNK_X;
    const baseZ = chunk.cz * CHUNK_Z;

    for (let lx = 0; lx < CHUNK_X; lx++) {
      for (let lz = 0; lz < CHUNK_Z; lz++) {
        const h = this.heightAt(baseX + lx, baseZ + lz);
        const beach = h <= SEA_LEVEL + 1;

        for (let y = 0; y <= h; y++) {
          let id = STONE;
          if (y === h) id = beach ? SAND : GRASS;
          else if (y > h - 4) id = beach ? SAND : DIRT;
          chunk.set(lx, y, lz, id);
        }
        for (let y = h + 1; y <= SEA_LEVEL; y++) chunk.set(lx, y, lz, WATER);
      }
    }

    this.plantTrees(chunk);
  }

  private plantTrees(chunk: Chunk): void {
    const baseX = chunk.cx * CHUNK_X;
    const baseZ = chunk.cz * CHUNK_Z;
    // Canopy radius is 2, so only plant where the whole tree fits inside this
    // chunk — keeps generation single-chunk and deterministic.
    for (let lx = 2; lx < CHUNK_X - 2; lx++) {
      for (let lz = 2; lz < CHUNK_Z - 2; lz++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        if (hash01(wx, wz, this.seed) >= 0.012) continue;
        const h = this.heightAt(wx, wz);
        if (h <= SEA_LEVEL + 1) continue; // no trees on beaches or underwater

        const trunk = 4 + Math.floor(hash01(wx, wz, this.seed ^ 0x9e3779) * 2);
        const top = h + trunk;
        if (top + 2 >= CHUNK_Y) continue;

        for (let y = h + 1; y <= top; y++) chunk.set(lx, y, lz, WOOD);

        // Canopy: two 5×5 layers (minus corners), a 3×3 cap, then a single tip.
        for (let dy = -1; dy <= 0; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
              this.leaf(chunk, lx + dx, top + dy, lz + dz);
            }
          }
        }
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) this.leaf(chunk, lx + dx, top + 1, lz + dz);
        }
        this.leaf(chunk, lx, top + 2, lz);
      }
    }
  }

  private leaf(chunk: Chunk, x: number, y: number, z: number): void {
    if (chunk.get(x, y, z) === 0) chunk.set(x, y, z, LEAVES);
  }
}
