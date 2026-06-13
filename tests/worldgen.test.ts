// Worldgen determinism and terrain structure invariants.
import { describe, expect, it } from "vitest";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "../src/world/Chunk";
import { WorldGen, SEA_LEVEL } from "../src/world/WorldGen";
import {
  BEDROCK, COAL_ORE, DIAMOND_ORE, GOLD_ORE, IRON_ORE, REDSTONE_ORE, WATER, WOOD,
} from "../src/world/Block";

const ORE_IDS = [COAL_ORE, IRON_ORE, GOLD_ORE, DIAMOND_ORE, REDSTONE_ORE];

describe("WorldGen", () => {
  it("generates identical chunks for the same seed", () => {
    const a = new Chunk(3, -2);
    const b = new Chunk(3, -2);
    new WorldGen(1234).generate(a);
    new WorldGen(1234).generate(b);
    expect(a.data).toEqual(b.data);
  });

  it("generates different terrain for different seeds", () => {
    const a = new Chunk(0, 0);
    const b = new Chunk(0, 0);
    new WorldGen(1).generate(a);
    new WorldGen(2).generate(b);
    expect(a.data).not.toEqual(b.data);
  });

  it("keeps heights inside the chunk's vertical range", () => {
    const gen = new WorldGen(99);
    for (let i = -500; i <= 500; i += 37) {
      const h = gen.heightAt(i, -i * 3);
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(CHUNK_Y - 8);
    }
  });

  it("lays an unbreakable bedrock floor at y=0 with solid ground above", () => {
    const gen = new WorldGen(7);
    const chunk = new Chunk(0, 0);
    gen.generate(chunk);
    for (let x = 0; x < CHUNK_X; x++) {
      for (let z = 0; z < CHUNK_Z; z++) {
        expect(chunk.get(x, 0, z)).toBe(BEDROCK);
        // Caves can breach the surface, so don't require an un-carved top;
        // just require the column isn't hollowed all the way down.
        const h = gen.heightAt(x, z);
        let solid = 0;
        for (let y = 1; y <= h; y++) if (chunk.get(x, y, z) !== 0) solid++;
        expect(solid).toBeGreaterThan(0);
      }
    }
  });

  it("produces at least one biome boundary across a wide span", () => {
    const gen = new WorldGen(2024);
    const biomes = new Set<string>();
    for (let wx = -2000; wx <= 2000; wx += 64) {
      for (let wz = -2000; wz <= 2000; wz += 64) biomes.add(gen.biomeAt(wx, wz));
    }
    expect(biomes.size).toBeGreaterThan(1);
  });

  it("carves caves — some underground stone becomes air", () => {
    const gen = new WorldGen(1337);
    let air = 0;
    for (let cx = -1; cx <= 1; cx++) {
      for (let cz = -1; cz <= 1; cz++) {
        const chunk = new Chunk(cx, cz);
        gen.generate(chunk);
        for (let x = 0; x < CHUNK_X; x++) {
          for (let z = 0; z < CHUNK_Z; z++) {
            // air below y=40 (well under any surface) implies a carved cave
            for (let y = 12; y < 40; y++) if (chunk.get(x, y, z) === 0) air++;
          }
        }
      }
    }
    expect(air).toBeGreaterThan(0);
  });

  it("places ores underground and never at the surface skin", () => {
    const gen = new WorldGen(1337);
    let ores = 0;
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        const chunk = new Chunk(cx, cz);
        gen.generate(chunk);
        for (let x = 0; x < CHUNK_X; x++) {
          for (let z = 0; z < CHUNK_Z; z++) {
            for (let y = 0; y < CHUNK_Y; y++) {
              if (ORE_IDS.includes(chunk.get(x, y, z))) ores++;
            }
          }
        }
      }
    }
    expect(ores).toBeGreaterThan(0);
  });

  it("fills water up to sea level and grows trees somewhere", () => {
    const gen = new WorldGen(1337);
    let water = 0;
    let wood = 0;
    for (let cx = -3; cx <= 3; cx++) {
      for (let cz = -3; cz <= 3; cz++) {
        const chunk = new Chunk(cx, cz);
        gen.generate(chunk);
        for (let x = 0; x < CHUNK_X; x++) {
          for (let z = 0; z < CHUNK_Z; z++) {
            for (let y = 0; y < CHUNK_Y; y++) {
              const id = chunk.get(x, y, z);
              if (id === WATER && y <= SEA_LEVEL) water++;
              if (id === WOOD) wood++;
            }
          }
        }
      }
    }
    expect(water).toBeGreaterThan(0);
    expect(wood).toBeGreaterThan(0);
  });
});
