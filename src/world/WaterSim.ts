// WaterSim: a bounded cellular water flow. Untracked water (the worldgen sea) is
// an infinite source (level 8); water that flows gets a decreasing level and
// stops spreading at 1, so breaching the sea floods a dug hole without drowning
// the whole world. Falling water (air below) drops straight down. Settled water
// is just WATER blocks, so it persists via the normal chunk-diff save.
import { AIR, WATER, isSolid } from "./Block";

const SOURCE_LEVEL = 8;
const TICK = 0.2; // seconds between flow steps
const BUDGET = 400; // cells processed per step

interface FluidWorld {
  getBlock(x: number, y: number, z: number): number;
  setBlock(x: number, y: number, z: number, id: number): void;
}

const NEIGHBORS_6: [number, number, number][] = [
  [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
];
const NEIGHBORS_H: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class WaterSim {
  private readonly active = new Set<string>();
  private readonly level = new Map<string, number>();
  private timer = 0;

  constructor(private readonly world: FluidWorld) {}

  private static key(x: number, y: number, z: number): string {
    return x + "," + y + "," + z;
  }

  /** Wake any water touching a cell that just changed (e.g. a mined block). */
  disturb(x: number, y: number, z: number): void {
    for (const [dx, dy, dz] of NEIGHBORS_6) {
      if (this.world.getBlock(x + dx, y + dy, z + dz) === WATER) {
        this.active.add(WaterSim.key(x + dx, y + dy, z + dz));
      }
    }
  }

  private levelAt(x: number, y: number, z: number): number {
    return this.level.get(WaterSim.key(x, y, z)) ?? SOURCE_LEVEL;
  }

  private setWater(x: number, y: number, z: number, lvl: number): void {
    this.world.setBlock(x, y, z, WATER);
    this.level.set(WaterSim.key(x, y, z), lvl);
    this.active.add(WaterSim.key(x, y, z));
  }

  /** Advance the simulation; throttled and budgeted to spread over many frames. */
  update(dt: number): void {
    this.timer += dt;
    if (this.timer < TICK || this.active.size === 0) return;
    this.timer = 0;

    const pending = [...this.active];
    this.active.clear();
    let budget = BUDGET;
    for (const k of pending) {
      if (budget-- <= 0) { this.active.add(k); continue; }
      this.step(k);
    }
  }

  private step(k: string): void {
    const [x, y, z] = k.split(",").map(Number);
    if (y <= 0) return; // never flow below the world floor
    if (this.world.getBlock(x, y, z) !== WATER) return;
    const lvl = this.levelAt(x, y, z);
    const below = this.world.getBlock(x, y - 1, z);
    if (below === AIR) {
      this.setWater(x, y - 1, z, SOURCE_LEVEL); // falling water reaches full strength
    } else if (isSolid(below) || below === WATER) {
      if (lvl > 1) {
        for (const [dx, dz] of NEIGHBORS_H) {
          if (this.world.getBlock(x + dx, y, z + dz) === AIR) this.setWater(x + dx, y, z + dz, lvl - 1);
        }
      }
    }
  }
}
