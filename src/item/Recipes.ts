// Recipes: shaped + shapeless crafting and furnace smelting. Pure of DOM/three
// so it's unit-testable. craft() takes a grid of item ids (null = empty) and a
// grid size (2 or 3) and returns the output stack, or null for no match.
import type { ItemStack } from "./ItemStack";
import {
  I_PLANKS, I_STICK, I_LOG, I_COBBLESTONE, I_TORCH, I_COAL, I_CRAFTING_TABLE,
  I_FURNACE, I_GLASS, I_STONE, I_IRON_INGOT, I_GOLD_INGOT, I_RAW_IRON, I_RAW_GOLD, I_SAND,
  I_WOOD_PICKAXE, I_STONE_PICKAXE, I_IRON_PICKAXE, I_WOOD_AXE, I_STONE_AXE, I_IRON_AXE,
  I_WOOD_SHOVEL, I_STONE_SHOVEL, I_IRON_SHOVEL, I_WOOD_SWORD, I_STONE_SWORD, I_IRON_SWORD,
  I_RAW_PORK, I_COOKED_PORK, I_RAW_BEEF, I_COOKED_BEEF, I_RAW_MUTTON, I_COOKED_MUTTON,
  I_RAW_CHICKEN, I_COOKED_CHICKEN,
} from "./Item";

interface ShapedRecipe {
  shaped: true;
  rows: string[]; // characters mapped via `key`; space = empty
  key: Record<string, number>;
  out: ItemStack;
}
interface ShapelessRecipe {
  shaped: false;
  ingredients: number[]; // item ids, order-independent
  out: ItemStack;
}
type Recipe = ShapedRecipe | ShapelessRecipe;

// Tool shapes (M = head material, S = stick).
const pickaxe = (M: number, S: number, out: number): ShapedRecipe =>
  ({ shaped: true, rows: ["MMM", " S ", " S "], key: { M, S }, out: { item: out, count: 1 } });
const axe = (M: number, S: number, out: number): ShapedRecipe =>
  ({ shaped: true, rows: ["MM", "MS", " S"], key: { M, S }, out: { item: out, count: 1 } });
const shovel = (M: number, S: number, out: number): ShapedRecipe =>
  ({ shaped: true, rows: ["M", "S", "S"], key: { M, S }, out: { item: out, count: 1 } });
const sword = (M: number, S: number, out: number): ShapedRecipe =>
  ({ shaped: true, rows: ["M", "M", "S"], key: { M, S }, out: { item: out, count: 1 } });

const RECIPES: Recipe[] = [
  { shaped: false, ingredients: [I_LOG], out: { item: I_PLANKS, count: 4 } },
  { shaped: true, rows: ["P", "P"], key: { P: I_PLANKS }, out: { item: I_STICK, count: 4 } },
  { shaped: true, rows: ["PP", "PP"], key: { P: I_PLANKS }, out: { item: I_CRAFTING_TABLE, count: 1 } },
  { shaped: true, rows: ["CCC", "C C", "CCC"], key: { C: I_COBBLESTONE }, out: { item: I_FURNACE, count: 1 } },
  { shaped: true, rows: ["A", "S"], key: { A: I_COAL, S: I_STICK }, out: { item: I_TORCH, count: 4 } },
  pickaxe(I_PLANKS, I_STICK, I_WOOD_PICKAXE),
  pickaxe(I_COBBLESTONE, I_STICK, I_STONE_PICKAXE),
  pickaxe(I_IRON_INGOT, I_STICK, I_IRON_PICKAXE),
  axe(I_PLANKS, I_STICK, I_WOOD_AXE),
  axe(I_COBBLESTONE, I_STICK, I_STONE_AXE),
  axe(I_IRON_INGOT, I_STICK, I_IRON_AXE),
  shovel(I_PLANKS, I_STICK, I_WOOD_SHOVEL),
  shovel(I_COBBLESTONE, I_STICK, I_STONE_SHOVEL),
  shovel(I_IRON_INGOT, I_STICK, I_IRON_SHOVEL),
  sword(I_PLANKS, I_STICK, I_WOOD_SWORD),
  sword(I_COBBLESTONE, I_STICK, I_STONE_SWORD),
  sword(I_IRON_INGOT, I_STICK, I_IRON_SWORD),
];

// Trim a recipe's rows to their non-space bounding box for offset-independent matching.
function trimPattern(rows: string[]): string[] {
  let top = 0, bottom = rows.length - 1;
  while (top < rows.length && rows[top].trim() === "") top++;
  while (bottom >= 0 && rows[bottom].trim() === "") bottom--;
  const slice = rows.slice(top, bottom + 1);
  let left = Infinity, right = -1;
  for (const r of slice) {
    for (let i = 0; i < r.length; i++) {
      if (r[i] !== " ") { left = Math.min(left, i); right = Math.max(right, i); }
    }
  }
  return slice.map((r) => r.slice(left, right + 1).padEnd(right - left + 1, " "));
}

// Trim a flat grid of item ids to its occupied bounding box; returns rows of ids.
function trimGrid(grid: (number | null)[], size: number): (number | null)[][] {
  let top = size, bottom = -1, left = size, right = -1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r * size + c] != null) {
        top = Math.min(top, r); bottom = Math.max(bottom, r);
        left = Math.min(left, c); right = Math.max(right, c);
      }
    }
  }
  if (bottom < 0) return [];
  const out: (number | null)[][] = [];
  for (let r = top; r <= bottom; r++) {
    const row: (number | null)[] = [];
    for (let c = left; c <= right; c++) row.push(grid[r * size + c]);
    out.push(row);
  }
  return out;
}

function matchesShaped(grid: (number | null)[], size: number, recipe: ShapedRecipe): boolean {
  const g = trimGrid(grid, size);
  const p = trimPattern(recipe.rows);
  if (g.length !== p.length) return false;
  for (let r = 0; r < p.length; r++) {
    if (g[r].length !== p[r].length) return false;
    for (let c = 0; c < p[r].length; c++) {
      const want = p[r][c] === " " ? null : recipe.key[p[r][c]];
      if ((g[r][c] ?? null) !== (want ?? null)) return false;
    }
  }
  return true;
}

function matchesShapeless(grid: (number | null)[], recipe: ShapelessRecipe): boolean {
  const have = grid.filter((x): x is number => x != null).sort();
  const want = [...recipe.ingredients].sort();
  if (have.length !== want.length) return false;
  return have.every((v, i) => v === want[i]);
}

/** Output for a crafting grid of item ids, or null if nothing matches. */
export function craft(grid: (number | null)[], size: number): ItemStack | null {
  for (const recipe of RECIPES) {
    const ok = recipe.shaped ? matchesShaped(grid, size, recipe) : matchesShapeless(grid, recipe);
    if (ok) return { item: recipe.out.item, count: recipe.out.count };
  }
  return null;
}

// --- Smelting ---------------------------------------------------------------
export const COOK_TIME = 6; // seconds to smelt one item

const SMELT: Record<number, number> = {
  [I_RAW_IRON]: I_IRON_INGOT,
  [I_RAW_GOLD]: I_GOLD_INGOT,
  [I_SAND]: I_GLASS,
  [I_COBBLESTONE]: I_STONE,
  [I_RAW_PORK]: I_COOKED_PORK,
  [I_RAW_BEEF]: I_COOKED_BEEF,
  [I_RAW_MUTTON]: I_COOKED_MUTTON,
  [I_RAW_CHICKEN]: I_COOKED_CHICKEN,
};

// Burn time in seconds each fuel item provides.
const FUEL: Record<number, number> = {
  [I_COAL]: 48,
  [I_LOG]: 9,
  [I_PLANKS]: 9,
  [I_STICK]: 3,
};

export function smeltResult(item: number): number | null {
  return SMELT[item] ?? null;
}

export function fuelValue(item: number): number {
  return FUEL[item] ?? 0;
}
