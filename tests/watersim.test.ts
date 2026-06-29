// WaterSim flow logic against a small stub world.
import { describe, expect, it } from "vitest";
import { WaterSim } from "../src/world/WaterSim";
import { AIR, WATER, STONE } from "../src/world/Block";

// Minimal block grid keyed by "x,y,z"; everything unset reads as AIR.
function stubWorld(initial: Record<string, number> = {}) {
  const m = new Map<string, number>(Object.entries(initial));
  return {
    getBlock: (x: number, y: number, z: number) => m.get(`${x},${y},${z}`) ?? AIR,
    setBlock: (x: number, y: number, z: number, id: number) => m.set(`${x},${y},${z}`, id),
    raw: m,
  };
}

function runUntilSettled(sim: WaterSim, steps = 200): void {
  for (let i = 0; i < steps; i++) sim.update(1); // dt=1 ≥ TICK each call
}

describe("WaterSim", () => {
  it("falls straight down through air onto the floor", () => {
    const world = stubWorld({ "0,5,0": WATER, "0,0,0": STONE });
    const sim = new WaterSim(world);
    sim.disturb(0, 4, 0); // a cleared cell beneath the source wakes it... use direct neighbour
    // Activate the source by disturbing the cell below it.
    sim.disturb(0, 4, 0);
    runUntilSettled(sim);
    // Column of water from y1..y5 should now exist above the stone floor.
    for (let y = 1; y <= 5; y++) expect(world.getBlock(0, y, 0)).toBe(WATER);
    expect(world.getBlock(0, 0, 0)).toBe(STONE);
  });

  it("spreads horizontally on a floor with decreasing range, then stops", () => {
    // A source at the origin on a wide stone floor; surrounding cells are air.
    const floor: Record<string, number> = { "0,1,0": WATER };
    for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) floor[`${x},0,${z}`] = STONE;
    const world = stubWorld(floor);
    const sim = new WaterSim(world);
    sim.disturb(1, 1, 0); // wake the source via an adjacent air cell
    runUntilSettled(sim);
    // Source spreads up to 7 cells (level 8 → 1); cell 7 wet, cell 8 dry.
    expect(world.getBlock(7, 1, 0)).toBe(WATER);
    expect(world.getBlock(8, 1, 0)).toBe(AIR);
  });

  it("does nothing when there is no water to disturb", () => {
    const world = stubWorld({ "0,0,0": STONE });
    const sim = new WaterSim(world);
    sim.disturb(0, 1, 0);
    runUntilSettled(sim);
    expect(world.getBlock(0, 1, 0)).toBe(AIR);
  });
});
