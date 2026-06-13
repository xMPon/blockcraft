// Furnace: per-furnace smelting state plus a coord-keyed registry (block ids in
// the chunk array can't hold this, so it lives alongside the world). A furnace
// burns fuel to cook a smeltable input into its output over COOK_TIME.
import { COOK_TIME, smeltResult, fuelValue } from "../item/Recipes";
import { maxStack, type ItemStack } from "../item/ItemStack";

export class FurnaceState {
  input: ItemStack | null = null;
  fuel: ItemStack | null = null;
  output: ItemStack | null = null;
  burn = 0; // seconds of fuel left
  burnMax = 0; // length of the current fuel (for the flame gauge)
  cook = 0; // seconds cooked toward the current item

  /** Item the input would smelt into, if anything. */
  private result(): number | null {
    return this.input ? smeltResult(this.input.item) : null;
  }

  private canOutput(result: number): boolean {
    return this.output === null || (this.output.item === result && this.output.count < maxStack(result));
  }

  tick(dt: number): void {
    const result = this.result();
    const working = result !== null && this.canOutput(result);

    // Light fresh fuel only when there's something to cook.
    if (this.burn <= 0 && working && this.fuel) {
      const fv = fuelValue(this.fuel.item);
      if (fv > 0) {
        this.burn = fv;
        this.burnMax = fv;
        this.fuel.count -= 1;
        if (this.fuel.count <= 0) this.fuel = null;
      }
    }

    if (this.burn > 0 && working && result !== null && this.input) {
      this.burn -= dt;
      this.cook += dt;
      if (this.cook >= COOK_TIME) {
        this.cook -= COOK_TIME;
        if (this.output) this.output.count += 1;
        else this.output = { item: result, count: 1 };
        this.input.count -= 1;
        if (this.input.count <= 0) this.input = null;
      }
    } else {
      if (this.burn > 0) this.burn -= dt; // fuel keeps burning down even idle
      this.cook = Math.max(0, this.cook - dt * 2);
    }
  }

  /** Slots that should drop when the furnace block is broken. */
  contents(): ItemStack[] {
    return [this.input, this.fuel, this.output].filter((s): s is ItemStack => s !== null);
  }
}

export class Furnaces {
  private readonly map = new Map<string, FurnaceState>();

  private static key(x: number, y: number, z: number): string {
    return x + "," + y + "," + z;
  }

  getOrCreate(x: number, y: number, z: number): FurnaceState {
    const k = Furnaces.key(x, y, z);
    let s = this.map.get(k);
    if (!s) {
      s = new FurnaceState();
      this.map.set(k, s);
    }
    return s;
  }

  remove(x: number, y: number, z: number): ItemStack[] {
    const k = Furnaces.key(x, y, z);
    const s = this.map.get(k);
    if (!s) return [];
    this.map.delete(k);
    return s.contents();
  }

  tick(dt: number): void {
    for (const s of this.map.values()) s.tick(dt);
  }
}
