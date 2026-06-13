// Mining: break-time scaling, the harvest-tier gate, the drop table, and the
// progress tracker's reset-on-retarget behaviour.
import { describe, expect, it } from "vitest";
import { breakTime, canHarvest, MiningState, type Tool } from "../src/player/Mining";
import { blockDrop, I_COBBLESTONE, I_DIRT } from "../src/item/Item";
import { BEDROCK, DIRT, IRON_ORE, LEAVES, STONE } from "../src/world/Block";

const woodPick: Tool = { kind: "pickaxe", tier: 1, speed: 2 };
const stonePick: Tool = { kind: "pickaxe", tier: 2, speed: 4 };
const ironPick: Tool = { kind: "pickaxe", tier: 3, speed: 6 };

describe("breakTime", () => {
  it("is faster with a better tool and infinite for unbreakable blocks", () => {
    expect(breakTime(STONE, null)).toBeGreaterThan(breakTime(STONE, stonePick));
    expect(breakTime(STONE, stonePick)).toBeGreaterThan(breakTime(STONE, ironPick));
    expect(breakTime(BEDROCK, ironPick)).toBe(Infinity);
  });
});

describe("canHarvest", () => {
  it("lets anything harvest tier-0 blocks", () => {
    expect(canHarvest(DIRT, null)).toBe(true);
  });
  it("gates stone behind any pickaxe", () => {
    expect(canHarvest(STONE, null)).toBe(false);
    expect(canHarvest(STONE, woodPick)).toBe(true);
  });
  it("gates iron ore behind a stone-tier (or better) pickaxe", () => {
    expect(canHarvest(IRON_ORE, woodPick)).toBe(false);
    expect(canHarvest(IRON_ORE, stonePick)).toBe(true);
  });
});

describe("blockDrop", () => {
  it("maps stone to cobblestone, grass-family to dirt, and leaves to nothing", () => {
    expect(blockDrop(STONE)).toBe(I_COBBLESTONE);
    expect(blockDrop(DIRT)).toBe(I_DIRT);
    expect(blockDrop(LEAVES)).toBeNull();
  });
});

describe("MiningState", () => {
  it("accumulates progress and reports completion once", () => {
    const m = new MiningState();
    const tgt = { x: 0, y: 0, z: 0 };
    const t = breakTime(STONE, stonePick);
    expect(m.update(true, tgt, STONE, stonePick, t * 0.5)).toBe(false);
    expect(m.progress).toBeGreaterThan(0);
    expect(m.update(true, tgt, STONE, stonePick, t * 0.6)).toBe(true);
    expect(m.target).toBeNull();
  });

  it("resets progress when the target changes", () => {
    const m = new MiningState();
    m.update(true, { x: 0, y: 0, z: 0 }, STONE, stonePick, 0.4);
    const before = m.progress;
    m.update(true, { x: 1, y: 0, z: 0 }, STONE, stonePick, 0.01);
    expect(m.progress).toBeLessThan(before);
  });

  it("clears state when not mining", () => {
    const m = new MiningState();
    m.update(true, { x: 0, y: 0, z: 0 }, STONE, stonePick, 0.4);
    m.update(false, null, 0, null, 0.4);
    expect(m.target).toBeNull();
    expect(m.progress).toBe(0);
  });
});
