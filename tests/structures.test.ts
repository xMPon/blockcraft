// Village generation: towns appear, sit above sea level, and are deterministic.
import { describe, expect, it } from "vitest";
import { WorldGen } from "../src/world/WorldGen";
import { Chunk } from "../src/world/Chunk";
import { CHEST, PLANKS } from "../src/world/Block";

// Generate a square of chunks and collect house markers (one chest per house).
function scan(seed: number, radius: number) {
  const gen = new WorldGen(seed);
  let chests = 0;
  let planks = 0;
  let lowestChestY = Infinity;
  for (let cx = -radius; cx <= radius; cx++) {
    for (let cz = -radius; cz <= radius; cz++) {
      const chunk = new Chunk(cx, cz);
      gen.generate(chunk);
      for (let lx = 0; lx < 16; lx++) {
        for (let lz = 0; lz < 16; lz++) {
          for (let y = 0; y < 128; y++) {
            const b = chunk.get(lx, y, lz);
            if (b === CHEST) { chests++; lowestChestY = Math.min(lowestChestY, y); }
            else if (b === PLANKS) planks++;
          }
        }
      }
    }
  }
  return { chests, planks, lowestChestY };
}

describe("village generation", () => {
  it("places houses (chests + planks) above sea level", () => {
    const r = scan(1337, 8);
    expect(r.chests).toBeGreaterThan(0);
    expect(r.planks).toBeGreaterThan(50); // walls/roofs are many planks
    expect(r.lowestChestY).toBeGreaterThan(63); // above sea level
  });

  it("is deterministic for a given seed", () => {
    expect(scan(2024, 4)).toEqual(scan(2024, 4));
  });
});
