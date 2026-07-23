// Fall-damage curve plus fluid movement: water/lava buoyancy through update().
import { describe, expect, it } from "vitest";
import { Player, fallDamage } from "../src/player/Player";
import type { World } from "../src/world/World";
import type { Input } from "../src/core/Input";
import { AIR, WATER, LAVA } from "../src/world/Block";

describe("fallDamage", () => {
  it("absorbs falls up to the safe height", () => {
    expect(fallDamage(0)).toBe(0);
    expect(fallDamage(3)).toBe(0);
  });

  it("deals 1 HP per block past the safe height", () => {
    expect(fallDamage(4)).toBe(1);
    expect(fallDamage(7)).toBe(4);
    expect(fallDamage(23)).toBe(20); // a lethal fall
  });
});

// Minimal block grid keyed by "x,y,z"; everything unset reads as AIR. Enough
// surface for Player.update() → bodyIn()/moveAndCollide(), which only read blocks.
function stubWorld(initial: Record<string, number> = {}): World {
  const m = new Map<string, number>(Object.entries(initial));
  return {
    getBlock: (x: number, y: number, z: number) => m.get(`${x},${y},${z}`) ?? AIR,
    setBlock: (x: number, y: number, z: number, id: number) => m.set(`${x},${y},${z}`, id),
  } as unknown as World;
}

// Fill a single x/z column with `block` over a y range so both the feet (+0.1)
// and waist (+0.9) samples land inside the fluid as the player bobs.
function fluidColumn(block: number, x = 0, z = 0, y0 = -5, y1 = 12): Record<string, number> {
  const cells: Record<string, number> = {};
  for (let y = y0; y <= y1; y++) cells[`${x},${y},${z}`] = block;
  return cells;
}

function stubInput(down: string[] = []): Input {
  const set = new Set(down);
  return {
    locked: false,
    consumeMouseDelta: () => ({ dx: 0, dy: 0 }),
    isDown: (code: string) => set.has(code),
  } as unknown as Input;
}

function tick(player: Player, input: Input, world: World, frames: number, dt = 1 / 60): void {
  for (let i = 0; i < frames; i++) player.update(dt, input, world);
}

describe("fluid buoyancy", () => {
  it("sinks slowly in lava instead of falling at full gravity", () => {
    const world = stubWorld(fluidColumn(LAVA));
    const player = new Player(0.5, 5, 0.5);
    tick(player, stubInput(), world, 30);
    expect(player.inLava).toBe(true);
    // Terminal sink speed is capped — nowhere near a free-fall plunge.
    expect(player.velocity.y).toBeGreaterThanOrEqual(-1.2 - 1e-6);
    expect(player.velocity.y).toBeLessThan(0); // still gently sinking
    // Half a second of capped sink drops well under a block, not a plummet.
    expect(player.position.y).toBeGreaterThan(4);
  });

  it("plummets far faster in open air than in lava (the float fix)", () => {
    const air = new Player(0.5, 5, 0.5);
    tick(air, stubInput(), stubWorld(), 30);
    const lava = new Player(0.5, 5, 0.5);
    tick(lava, stubInput(), stubWorld(fluidColumn(LAVA)), 30);
    // Air free-fall builds real speed; lava is clamped to its sink cap.
    expect(air.velocity.y).toBeLessThan(-5);
    expect(lava.velocity.y).toBeGreaterThan(air.velocity.y + 3);
  });

  it("lets you climb out of lava by holding Space", () => {
    const world = stubWorld(fluidColumn(LAVA));
    const player = new Player(0.5, 5, 0.5);
    tick(player, stubInput(["Space"]), world, 30);
    expect(player.position.y).toBeGreaterThan(5); // rose above the start
  });

  it("wades through lava more sluggishly than through water", () => {
    const lava = new Player(0.5, 5, 0.5);
    tick(lava, stubInput(["KeyW"]), stubWorld(fluidColumn(LAVA)), 15);
    const water = new Player(0.5, 5, 0.5);
    tick(water, stubInput(["KeyW"]), stubWorld(fluidColumn(WATER)), 15);
    const lavaDist = Math.hypot(lava.position.x - 0.5, lava.position.z - 0.5);
    const waterDist = Math.hypot(water.position.x - 0.5, water.position.z - 0.5);
    expect(waterDist).toBeGreaterThan(lavaDist);
  });
});
