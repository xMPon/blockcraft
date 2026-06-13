// ItemStack: an item id plus a count, with pure merge/split helpers. Kept free
// of DOM/three so it's unit-testable.
import { itemDef } from "./Item";

export interface ItemStack {
  item: number;
  count: number;
}

export function maxStack(item: number): number {
  return itemDef(item).maxStack;
}

/** Try to merge `src` into `dst`. Mutates both; returns true if dst changed. */
export function mergeInto(dst: ItemStack, src: ItemStack): boolean {
  if (dst.item !== src.item) return false;
  const room = maxStack(dst.item) - dst.count;
  if (room <= 0) return false;
  const moved = Math.min(room, src.count);
  dst.count += moved;
  src.count -= moved;
  return moved > 0;
}

/** Split `n` items off a stack into a new stack, shrinking the original. */
export function split(stack: ItemStack, n: number): ItemStack {
  const taken = Math.min(n, stack.count);
  stack.count -= taken;
  return { item: stack.item, count: taken };
}
