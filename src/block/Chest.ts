// Chest: a 27-slot storage block-entity, kept in a coord-keyed registry beside
// the world (the chunk array only holds the block id). Mirrors Furnace.
import type { ItemStack } from "../item/ItemStack";

export interface ChestSave {
  key: string;
  slots: (ItemStack | null)[];
}

export const CHEST_SLOTS = 27;

export class ChestState {
  readonly slots: (ItemStack | null)[] = new Array(CHEST_SLOTS).fill(null);

  /** Non-empty stacks, for dropping when the chest block breaks. */
  contents(): ItemStack[] {
    return this.slots.filter((s): s is ItemStack => s !== null);
  }
}

export class Chests {
  private readonly map = new Map<string, ChestState>();

  private static key(x: number, y: number, z: number): string {
    return x + "," + y + "," + z;
  }

  getOrCreate(x: number, y: number, z: number): ChestState {
    const k = Chests.key(x, y, z);
    let s = this.map.get(k);
    if (!s) {
      s = new ChestState();
      this.map.set(k, s);
    }
    return s;
  }

  remove(x: number, y: number, z: number): ItemStack[] {
    const k = Chests.key(x, y, z);
    const s = this.map.get(k);
    if (!s) return [];
    this.map.delete(k);
    return s.contents();
  }

  serialize(): ChestSave[] {
    const out: ChestSave[] = [];
    for (const [key, s] of this.map) {
      out.push({ key, slots: s.slots.map((x) => (x ? { item: x.item, count: x.count } : null)) });
    }
    return out;
  }

  restore(entries: ChestSave[]): void {
    for (const e of entries) {
      const s = new ChestState();
      for (let i = 0; i < CHEST_SLOTS; i++) {
        const x = e.slots[i];
        s.slots[i] = x ? { item: x.item, count: x.count } : null;
      }
      this.map.set(e.key, s);
    }
  }
}
