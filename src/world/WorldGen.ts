// WorldGen: deterministic terrain — biomes, layered surface, 3D-noise caves,
// depth-banded ore veins, and a bedrock floor. Same seed yields the same world.
import { createNoise2D, createNoise3D, type NoiseFunction2D, type NoiseFunction3D } from "simplex-noise";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "./Chunk";
import {
  BEDROCK, COAL_ORE, DIAMOND_ORE, DIRT, GOLD_ORE, GRASS, IRON_ORE, LAVA, LEAVES,
  REDSTONE_ORE, SAND, STONE, WATER, WOOD,
} from "./Block";
import { hash01, mulberry32 } from "../core/rng";

export const SEA_LEVEL = 63;
const BEDROCK_TOP = 4; // y 0 solid bedrock; 1..4 increasingly stone
const LAVA_LEVEL = 10; // carved cave space at/below this fills with lava

export type Biome = "plains" | "forest" | "desert" | "mountains";

interface OreSpec {
  block: number;
  attempts: number; // vein attempts per chunk
  size: number; // voxels per vein
  yMin: number;
  yMax: number;
}

// Rarer, deeper ores get fewer/smaller veins in a lower y-band.
const ORES: OreSpec[] = [
  { block: COAL_ORE, attempts: 14, size: 9, yMin: 6, yMax: 120 },
  { block: IRON_ORE, attempts: 10, size: 7, yMin: 6, yMax: 64 },
  { block: GOLD_ORE, attempts: 3, size: 6, yMin: 6, yMax: 32 },
  { block: REDSTONE_ORE, attempts: 4, size: 7, yMin: 6, yMax: 18 },
  { block: DIAMOND_ORE, attempts: 2, size: 6, yMin: 6, yMax: 16 },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class WorldGen {
  private readonly height: NoiseFunction2D;
  private readonly mountain: NoiseFunction2D;
  private readonly biomeNoise: NoiseFunction2D;
  private readonly cave: NoiseFunction3D;
  private readonly cave2: NoiseFunction3D;

  constructor(readonly seed: number) {
    this.height = createNoise2D(mulberry32(seed));
    this.mountain = createNoise2D(mulberry32(seed ^ 0x1234));
    this.biomeNoise = createNoise2D(mulberry32(seed ^ 0xa5a5));
    this.cave = createNoise3D(mulberry32(seed ^ 0xc0ffee));
    this.cave2 = createNoise3D(mulberry32(seed ^ 0x00beef));
  }

  biomeAt(wx: number, wz: number): Biome {
    const b = this.biomeNoise(wx / 320, wz / 320);
    if (b < -0.45) return "desert";
    if (b > 0.55) return "mountains";
    if (b > 0.15) return "forest";
    return "plains";
  }

  /** Terrain surface height (top solid block) for any world column. */
  heightAt(wx: number, wz: number): number {
    const rolling =
      this.height(wx / 160, wz / 160) * 9 +
      this.height(wx / 55 + 512, wz / 55 - 512) * 4 +
      this.height(wx / 18 - 256, wz / 18 + 256) * 1.5;
    // Mountain mask shares the biome noise so the "mountains" biome is the tall one.
    const mask = smoothstep(0.35, 0.7, this.biomeNoise(wx / 320, wz / 320));
    const mtn = mask * (this.mountain(wx / 90, wz / 90) * 0.5 + 0.5) * 42;
    const h = Math.floor(SEA_LEVEL + 2 + rolling + mtn);
    return Math.max(BEDROCK_TOP + 2, Math.min(CHUNK_Y - 8, h));
  }

  generate(chunk: Chunk): void {
    const baseX = chunk.cx * CHUNK_X;
    const baseZ = chunk.cz * CHUNK_Z;

    for (let lx = 0; lx < CHUNK_X; lx++) {
      for (let lz = 0; lz < CHUNK_Z; lz++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const h = this.heightAt(wx, wz);
        const sandy = this.biomeAt(wx, wz) === "desert" || h <= SEA_LEVEL + 1;
        const surface = sandy ? SAND : GRASS;
        const sub = sandy ? SAND : DIRT;

        for (let y = 0; y <= h; y++) {
          let id: number;
          if (y === 0) id = BEDROCK;
          else if (y <= BEDROCK_TOP && hash01(wx, wz * 31 + y, this.seed) < 1 - y / (BEDROCK_TOP + 1)) id = BEDROCK;
          else if (y === h) id = surface;
          else if (y > h - 4) id = sub;
          else id = STONE;
          chunk.set(lx, y, lz, id);
        }
        for (let y = h + 1; y <= SEA_LEVEL; y++) chunk.set(lx, y, lz, WATER);
      }
    }

    this.carveCaves(chunk);
    this.placeOres(chunk);
    this.plantTrees(chunk);
  }

  // Carve underground air with ridged-noise tunnels and deeper blobby caverns.
  // Lava fills the lowest carved cells; bedrock and water columns are left alone.
  private carveCaves(chunk: Chunk): void {
    const baseX = chunk.cx * CHUNK_X;
    const baseZ = chunk.cz * CHUNK_Z;
    for (let lx = 0; lx < CHUNK_X; lx++) {
      for (let lz = 0; lz < CHUNK_Z; lz++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        for (let y = BEDROCK_TOP + 1; y < CHUNK_Y; y++) {
          const cur = chunk.get(lx, y, lz);
          if (cur === 0 || cur === BEDROCK || cur === WATER) continue;
          const n1 = this.cave(wx / 22, y / 16, wz / 22);
          const n2 = this.cave2(wx / 22, y / 16, wz / 22);
          const tunnel = 1 - Math.abs(n1) > 0.86 && 1 - Math.abs(n2) > 0.86;
          const cavern = y < 50 && this.cave(wx / 30 + 100, y / 24, wz / 30 + 100) > 0.6;
          if (tunnel || cavern) chunk.set(lx, y, lz, y <= LAVA_LEVEL ? LAVA : 0);
        }
      }
    }
  }

  // Random-walk small ore blobs through stone, deterministic per chunk+ore.
  private placeOres(chunk: Chunk): void {
    for (const spec of ORES) {
      for (let i = 0; i < spec.attempts; i++) {
        const s = (n: number) => hash01(chunk.cx * 97 + i * 13 + spec.block * 7, chunk.cz * 89 + n, this.seed);
        let x = Math.floor(s(1) * CHUNK_X);
        let y = spec.yMin + Math.floor(s(2) * (spec.yMax - spec.yMin + 1));
        let z = Math.floor(s(3) * CHUNK_Z);
        for (let k = 0; k < spec.size; k++) {
          if (Chunk.inBounds(x, y, z) && chunk.get(x, y, z) === STONE) chunk.set(x, y, z, spec.block);
          x += Math.floor(s(10 + k * 3) * 3) - 1;
          y += Math.floor(s(11 + k * 3) * 3) - 1;
          z += Math.floor(s(12 + k * 3) * 3) - 1;
        }
      }
    }
  }

  private plantTrees(chunk: Chunk): void {
    const baseX = chunk.cx * CHUNK_X;
    const baseZ = chunk.cz * CHUNK_Z;
    // Canopy radius is 2, so only plant where the whole tree fits inside this chunk.
    for (let lx = 2; lx < CHUNK_X - 2; lx++) {
      for (let lz = 2; lz < CHUNK_Z - 2; lz++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const biome = this.biomeAt(wx, wz);
        if (biome === "desert") continue;
        const density = biome === "forest" ? 0.045 : biome === "mountains" ? 0.005 : 0.009;
        if (hash01(wx, wz, this.seed) >= density) continue;
        const h = this.heightAt(wx, wz);
        if (h <= SEA_LEVEL + 1) continue;
        if (chunk.get(lx, h, lz) !== GRASS) continue; // surface may have been carved

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
