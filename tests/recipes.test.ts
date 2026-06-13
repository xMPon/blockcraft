// Crafting (shaped + shapeless) and smelting/fuel lookups.
import { describe, expect, it } from "vitest";
import { craft, smeltResult, fuelValue, COOK_TIME } from "../src/item/Recipes";
import {
  I_PLANKS, I_LOG, I_STICK, I_WOOD_PICKAXE, I_CRAFTING_TABLE,
  I_IRON_INGOT, I_RAW_IRON, I_SAND, I_GLASS, I_COAL,
} from "../src/item/Item";

const N = null;

describe("craft (shapeless)", () => {
  it("turns one log into four planks anywhere in the grid", () => {
    expect(craft([I_LOG, N, N, N], 2)).toEqual({ item: I_PLANKS, count: 4 });
    expect(craft([N, N, N, I_LOG], 2)).toEqual({ item: I_PLANKS, count: 4 });
  });
});

describe("craft (shaped)", () => {
  it("crafts a crafting table from a 2x2 of planks", () => {
    expect(craft([I_PLANKS, I_PLANKS, I_PLANKS, I_PLANKS], 2)).toEqual({ item: I_CRAFTING_TABLE, count: 1 });
  });

  it("crafts sticks from two stacked planks regardless of column offset", () => {
    // 2x2 grid, planks in the left column (rows 0 and 1).
    expect(craft([I_PLANKS, N, I_PLANKS, N], 2)).toEqual({ item: I_STICK, count: 4 });
    // Same shape shifted to the right column still matches.
    expect(craft([N, I_PLANKS, N, I_PLANKS], 2)).toEqual({ item: I_STICK, count: 4 });
  });

  it("crafts a wooden pickaxe from the 3x3 pattern", () => {
    const g = [
      I_PLANKS, I_PLANKS, I_PLANKS,
      N, I_STICK, N,
      N, I_STICK, N,
    ];
    expect(craft(g, 3)).toEqual({ item: I_WOOD_PICKAXE, count: 1 });
  });

  it("returns null for an unknown arrangement", () => {
    expect(craft([I_STICK, N, N, N], 2)).toBeNull();
    expect(craft([N, N, N, N], 2)).toBeNull();
  });
});

describe("smelting", () => {
  it("maps inputs to their smelted output", () => {
    expect(smeltResult(I_RAW_IRON)).toBe(I_IRON_INGOT);
    expect(smeltResult(I_SAND)).toBe(I_GLASS);
    expect(smeltResult(I_PLANKS)).toBeNull(); // planks are fuel, not smeltable
  });

  it("reports fuel burn times (coal lasts longest)", () => {
    expect(fuelValue(I_COAL)).toBeGreaterThan(fuelValue(I_PLANKS));
    expect(fuelValue(I_STICK)).toBeGreaterThan(0);
    expect(fuelValue(I_IRON_INGOT)).toBe(0); // not a fuel
    expect(COOK_TIME).toBeGreaterThan(0);
  });
});
