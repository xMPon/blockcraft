// Item stacks and inventory: merge/split, fill order, and removal.
import { describe, expect, it } from "vitest";
import { mergeInto, split } from "../src/item/ItemStack";
import { Inventory } from "../src/item/Inventory";
import { I_DIRT, I_STONE, I_STONE_PICKAXE } from "../src/item/Item";

describe("ItemStack", () => {
  it("merges same items up to the stack cap, leaving overflow in the source", () => {
    const dst = { item: I_DIRT, count: 60 };
    const src = { item: I_DIRT, count: 10 };
    expect(mergeInto(dst, src)).toBe(true);
    expect(dst.count).toBe(64);
    expect(src.count).toBe(6);
  });

  it("does not merge different items", () => {
    const dst = { item: I_DIRT, count: 1 };
    expect(mergeInto(dst, { item: I_STONE, count: 1 })).toBe(false);
    expect(dst.count).toBe(1);
  });

  it("splits a count off a stack", () => {
    const s = { item: I_DIRT, count: 10 };
    const taken = split(s, 4);
    expect(taken).toEqual({ item: I_DIRT, count: 4 });
    expect(s.count).toBe(6);
  });
});

describe("Inventory", () => {
  it("fills existing stacks before using empty slots", () => {
    const inv = new Inventory();
    inv.add(I_DIRT, 10);
    inv.add(I_DIRT, 5);
    expect(inv.slots[0]).toEqual({ item: I_DIRT, count: 15 });
    expect(inv.slots[1]).toBeNull();
  });

  it("spills into new slots past a full stack and reports leftover when full", () => {
    const inv = new Inventory();
    expect(inv.add(I_DIRT, 70)).toBe(0); // 64 + 6 across two slots
    expect(inv.slots[0]!.count).toBe(64);
    expect(inv.slots[1]!.count).toBe(6);

    // Fill every slot with stone, then dirt has nowhere to go.
    const full = new Inventory();
    for (let i = 0; i < full.slots.length; i++) full.slots[i] = { item: I_STONE, count: 64 };
    expect(full.add(I_DIRT, 5)).toBe(5);
  });

  it("removes across stacks and clears emptied slots", () => {
    const inv = new Inventory();
    inv.add(I_DIRT, 100); // 64 + 36
    expect(inv.remove(I_DIRT, 70)).toBe(70);
    expect(inv.has(I_DIRT)).toBe(true);
    expect(inv.remove(I_DIRT, 999)).toBe(30);
    expect(inv.has(I_DIRT)).toBe(false);
  });

  it("consumes one from the selected slot", () => {
    const inv = new Inventory();
    inv.add(I_STONE_PICKAXE, 1);
    inv.selected = 0;
    inv.consumeSelected();
    expect(inv.slots[0]).toBeNull();
  });
});
