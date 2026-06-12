// Worldgen determinism and terrain structure invariants.
import { describe, expect, it } from "vitest";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "../src/world/Chunk";
import { WorldGen, SEA_LEVEL } from "../src/world/WorldGen";
import { STONE, WATER, WOOD } from "../src/world/Block";

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
      expect(h).toBeLessThanOrEqual(CHUNK_Y - 12);
    }
  });

  it("builds columns with stone bedrock and a surface matching heightAt", () => {
    const gen = new WorldGen(7);
    const chunk = new Chunk(0, 0);
    gen.generate(chunk);
    for (let x = 0; x < CHUNK_X; x++) {
      for (let z = 0; z < CHUNK_Z; z++) {
        expect(chunk.get(x, 0, z)).toBe(STONE);
        const h = gen.heightAt(x, z);
        expect(chunk.get(x, h, z)).not.toBe(0); // surface block exists
      }
    }
  });

  it("fills water up to sea level and grows trees somewhere", () => {
    const gen = new WorldGen(1337); // the game's default seed
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
