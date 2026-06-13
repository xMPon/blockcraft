// Inventory: a fixed array of slots (null = empty). The first HOTBAR_SIZE slots
// are the hotbar row. Phase 3a uses add()/remove for pickups and placement;
// Phase 3b layers the crafting grid and slot drag/drop on top.
import { maxStack, type ItemStack } from "./ItemStack";

export const HOTBAR_SIZE = 9;
export const INVENTORY_SIZE = 36; // 27 main + 9 hotbar

export class Inventory {
  readonly slots: (ItemStack | null)[] = new Array(INVENTORY_SIZE).fill(null);
  selected = 0; // active hotbar index

  get selectedStack(): ItemStack | null {
    return this.slots[this.selected];
  }

  /** Add items, filling matching stacks first then empty slots. Returns leftover. */
  add(item: number, count: number): number {
    const cap = maxStack(item);
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      const s = this.slots[i];
      if (s && s.item === item && s.count < cap) {
        const moved = Math.min(cap - s.count, count);
        s.count += moved;
        count -= moved;
      }
    }
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (!this.slots[i]) {
        const moved = Math.min(cap, count);
        this.slots[i] = { item, count: moved };
        count -= moved;
      }
    }
    return count;
  }

  /** True if at least one of `item` exists anywhere. */
  has(item: number): boolean {
    return this.slots.some((s) => s?.item === item);
  }

  /** Remove up to `count` of `item` across slots; returns how many were removed. */
  remove(item: number, count: number): number {
    let removed = 0;
    for (let i = 0; i < this.slots.length && removed < count; i++) {
      const s = this.slots[i];
      if (!s || s.item !== item) continue;
      const take = Math.min(s.count, count - removed);
      s.count -= take;
      removed += take;
      if (s.count === 0) this.slots[i] = null;
    }
    return removed;
  }

  /** Consume one item from the selected hotbar slot (e.g. after placing). */
  consumeSelected(): void {
    const s = this.slots[this.selected];
    if (!s) return;
    s.count -= 1;
    if (s.count <= 0) this.slots[this.selected] = null;
  }
}
