// Persistence serialization round-trips (the IndexedDB Store itself is verified
// in the browser, since it needs a real IDB).
import { describe, expect, it } from "vitest";
import { Inventory } from "../src/item/Inventory";
import { Furnaces } from "../src/block/Furnace";
import { I_COAL, I_RAW_IRON, I_IRON_INGOT, I_STONE_PICKAXE } from "../src/item/Item";

describe("Inventory serialize/load", () => {
  it("round-trips slot contents", () => {
    const a = new Inventory();
    a.add(I_COAL, 30);
    a.add(I_STONE_PICKAXE, 1);
    a.slots[20] = { item: I_RAW_IRON, count: 5 };

    const b = new Inventory();
    b.load(a.serialize());
    expect(b.serialize()).toEqual(a.serialize());
    expect(b.slots[0]).toEqual({ item: I_COAL, count: 30 });
    expect(b.slots[20]).toEqual({ item: I_RAW_IRON, count: 5 });
  });

  it("produces independent copies (no shared references)", () => {
    const a = new Inventory();
    a.add(I_COAL, 10);
    const b = new Inventory();
    b.load(a.serialize());
    b.slots[0]!.count = 99;
    expect(a.slots[0]!.count).toBe(10);
  });
});

describe("Furnaces serialize/restore", () => {
  it("round-trips furnace state including progress", () => {
    const a = new Furnaces();
    const f = a.getOrCreate(3, 60, -2);
    f.input = { item: I_RAW_IRON, count: 4 };
    f.fuel = { item: I_COAL, count: 2 };
    f.output = { item: I_IRON_INGOT, count: 1 };
    f.burn = 12;
    f.burnMax = 48;
    f.cook = 3;

    const b = new Furnaces();
    b.restore(a.serialize());
    const r = b.getOrCreate(3, 60, -2);
    expect(r.input).toEqual({ item: I_RAW_IRON, count: 4 });
    expect(r.fuel).toEqual({ item: I_COAL, count: 2 });
    expect(r.output).toEqual({ item: I_IRON_INGOT, count: 1 });
    expect(r.burn).toBe(12);
    expect(r.cook).toBe(3);
  });
});
