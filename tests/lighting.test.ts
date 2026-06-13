// Light propagation: skylight columns, opaque occlusion, torch blocklight decay.
import { describe, expect, it } from "vitest";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "../src/world/Chunk";
import { computeLight, type LightWorld } from "../src/world/Lighting";
import { STONE, TORCH } from "../src/world/Block";

// A neighbourless world so only the chunk's own blocks affect lighting.
const isolated: LightWorld = {
  getBlock: () => 0,
  getLight: () => ({ sky: 0, block: 0 }),
};

describe("computeLight", () => {
  it("fills an open chunk with full skylight", () => {
    const c = new Chunk(0, 0);
    computeLight(isolated, c);
    expect(c.getSky(0, 0, 0)).toBe(15);
    expect(c.getSky(8, CHUNK_Y - 1, 8)).toBe(15);
  });

  it("blocks skylight beneath a sealed opaque slab", () => {
    const c = new Chunk(0, 0);
    for (let x = 0; x < CHUNK_X; x++) for (let z = 0; z < CHUNK_Z; z++) c.set(x, 40, z, STONE);
    computeLight(isolated, c);
    expect(c.getSky(8, 50, 8)).toBe(15); // above the slab
    expect(c.getSky(8, 30, 8)).toBe(0); // sealed below
  });

  it("decays torch blocklight by one per block", () => {
    const c = new Chunk(0, 0);
    c.set(8, 20, 8, TORCH);
    computeLight(isolated, c);
    expect(c.getBlockLight(8, 20, 8)).toBe(14);
    expect(c.getBlockLight(11, 20, 8)).toBe(11); // 3 blocks east
    expect(c.getBlockLight(8, 20, 14)).toBe(8); // 6 blocks along z
  });

  it("does not let blocklight pass through an opaque wall", () => {
    const c = new Chunk(0, 0);
    c.set(8, 20, 8, TORCH);
    // Seal the entire x=9 plane, isolating x>=10 from the torch.
    for (let y = 0; y < CHUNK_Y; y++) for (let z = 0; z < CHUNK_Z; z++) c.set(9, y, z, STONE);
    computeLight(isolated, c);
    expect(c.getBlockLight(8, 20, 8)).toBe(14);
    expect(c.getBlockLight(10, 20, 8)).toBe(0);
  });
});
