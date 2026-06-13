// Item registry: everything that can sit in an inventory slot — block-items
// (place a block), materials (coal, ingots, diamond…), and tools. Plus the
// block→drop table. Item ids are their own sequence, independent of block ids.
import {
  BLOCKS, COAL_ORE, COBBLESTONE, CRAFTING_TABLE, DIAMOND_ORE, DIRT, FURNACE, GLASS,
  GOLD_ORE, GRASS, GRAVEL, IRON_ORE, LEAVES, PLANKS, REDSTONE_ORE, SAND, STONE, TORCH, WOOD,
  TIER_WOOD, TIER_STONE, TIER_IRON, TIER_DIAMOND, type ToolKind,
} from "../world/Block";

export interface ItemDef {
  id: number;
  name: string;
  maxStack: number;
  /** Atlas tile for the 3D drop cube. */
  icon: number;
  /** CSS colour for the DOM hotbar/inventory swatch. */
  color: string;
  /** Block id this item places on right-click, if any. */
  placeBlock?: number;
  /** Mining capability, for tools. */
  tool?: { kind: ToolKind; tier: number; speed: number };
  /** Hunger restored when eaten (Phase 4). */
  food?: number;
}

// --- Item ids ---------------------------------------------------------------
// Block-items mirror their block where possible (place that block).
export const I_GRASS = 1;
export const I_DIRT = 2;
export const I_STONE = 3;
export const I_SAND = 4;
export const I_LOG = 5;
export const I_LEAVES = 6;
export const I_COBBLESTONE = 7;
export const I_PLANKS = 8;
export const I_GRAVEL = 9;
export const I_TORCH = 10;
export const I_CRAFTING_TABLE = 11;
export const I_FURNACE = 12;
export const I_GLASS = 13;
// Materials
export const I_COAL = 20;
export const I_RAW_IRON = 21;
export const I_RAW_GOLD = 22;
export const I_DIAMOND = 23;
export const I_REDSTONE = 24;
export const I_STICK = 25;
export const I_IRON_INGOT = 26;
export const I_GOLD_INGOT = 27;
// Tools (kind × tier)
export const I_WOOD_PICKAXE = 40;
export const I_STONE_PICKAXE = 41;
export const I_IRON_PICKAXE = 42;
export const I_DIAMOND_PICKAXE = 43;
export const I_WOOD_AXE = 44;
export const I_STONE_AXE = 45;
export const I_IRON_AXE = 46;
export const I_WOOD_SHOVEL = 47;
export const I_STONE_SHOVEL = 48;
export const I_IRON_SHOVEL = 49;
export const I_WOOD_SWORD = 50;
export const I_STONE_SWORD = 51;
export const I_IRON_SWORD = 52;

// Atlas item-icon tiles (drawn in TextureAtlas): 20 stick, 21 coal, 22 iron
// ingot, 23 gold ingot, 24 diamond, 25 raw iron, 26 raw gold, 27 redstone,
// 28 pickaxe, 29 axe, 30 shovel, 31 sword.
const T_STICK = 20, T_COAL = 21, T_IRON_INGOT = 22, T_GOLD_INGOT = 23;
const T_DIAMOND = 24, T_RAW_IRON = 25, T_RAW_GOLD = 26, T_REDSTONE = 27;
const T_PICKAXE = 28, T_AXE = 29, T_SHOVEL = 30, T_SWORD = 31;

const ITEMS = new Map<number, ItemDef>();

function block(id: number, name: string, blockId: number): void {
  const b = BLOCKS[blockId];
  ITEMS.set(id, { id, name, maxStack: 64, icon: b.tiles[1], color: b.color, placeBlock: blockId });
}
function material(id: number, name: string, icon: number, color: string, food?: number): void {
  ITEMS.set(id, { id, name, maxStack: 64, icon, color, food });
}
function tool(id: number, name: string, icon: number, color: string, kind: ToolKind, tier: number, speed: number): void {
  ITEMS.set(id, { id, name, maxStack: 1, icon, color, tool: { kind, tier, speed } });
}

block(I_GRASS, "grass block", GRASS);
block(I_DIRT, "dirt", DIRT);
block(I_STONE, "stone", STONE);
block(I_SAND, "sand", SAND);
block(I_LOG, "log", WOOD);
block(I_LEAVES, "leaves", LEAVES);
block(I_COBBLESTONE, "cobblestone", COBBLESTONE);
block(I_PLANKS, "planks", PLANKS);
block(I_GRAVEL, "gravel", GRAVEL);
block(I_TORCH, "torch", TORCH);
block(I_CRAFTING_TABLE, "crafting table", CRAFTING_TABLE);
block(I_FURNACE, "furnace", FURNACE);
block(I_GLASS, "glass", GLASS);

material(I_COAL, "coal", T_COAL, "#2a2a2a");
material(I_RAW_IRON, "raw iron", T_RAW_IRON, "#caa17e");
material(I_RAW_GOLD, "raw gold", T_RAW_GOLD, "#e6c558");
material(I_DIAMOND, "diamond", T_DIAMOND, "#52d9d0");
material(I_REDSTONE, "redstone", T_REDSTONE, "#d23a2a");
material(I_STICK, "stick", T_STICK, "#7b5836");
material(I_IRON_INGOT, "iron ingot", T_IRON_INGOT, "#e8d8c4");
material(I_GOLD_INGOT, "gold ingot", T_GOLD_INGOT, "#f2d65a");

tool(I_WOOD_PICKAXE, "wooden pickaxe", T_PICKAXE, "#b9925a", "pickaxe", TIER_WOOD, 2);
tool(I_STONE_PICKAXE, "stone pickaxe", T_PICKAXE, "#8a8a8a", "pickaxe", TIER_STONE, 4);
tool(I_IRON_PICKAXE, "iron pickaxe", T_PICKAXE, "#e8d8c4", "pickaxe", TIER_IRON, 6);
tool(I_DIAMOND_PICKAXE, "diamond pickaxe", T_PICKAXE, "#52d9d0", "pickaxe", TIER_DIAMOND, 8);
tool(I_WOOD_AXE, "wooden axe", T_AXE, "#b9925a", "axe", TIER_WOOD, 2);
tool(I_STONE_AXE, "stone axe", T_AXE, "#8a8a8a", "axe", TIER_STONE, 4);
tool(I_IRON_AXE, "iron axe", T_AXE, "#e8d8c4", "axe", TIER_IRON, 6);
tool(I_WOOD_SHOVEL, "wooden shovel", T_SHOVEL, "#b9925a", "shovel", TIER_WOOD, 2);
tool(I_STONE_SHOVEL, "stone shovel", T_SHOVEL, "#8a8a8a", "shovel", TIER_STONE, 4);
tool(I_IRON_SHOVEL, "iron shovel", T_SHOVEL, "#e8d8c4", "shovel", TIER_IRON, 6);
tool(I_WOOD_SWORD, "wooden sword", T_SWORD, "#b9925a", "sword", TIER_WOOD, 1);
tool(I_STONE_SWORD, "stone sword", T_SWORD, "#8a8a8a", "sword", TIER_STONE, 1);
tool(I_IRON_SWORD, "iron sword", T_SWORD, "#e8d8c4", "sword", TIER_IRON, 1);

export function itemDef(id: number): ItemDef {
  const d = ITEMS.get(id);
  if (!d) throw new Error("unknown item id " + id);
  return d;
}

// --- Block → drop table -----------------------------------------------------
// What item a mined block yields (before the harvest-tier gate is applied).
const BLOCK_DROPS: Record<number, number> = {
  [GRASS]: I_DIRT,
  [DIRT]: I_DIRT,
  [STONE]: I_COBBLESTONE,
  [SAND]: I_SAND,
  [GRAVEL]: I_GRAVEL,
  [WOOD]: I_LOG,
  [COBBLESTONE]: I_COBBLESTONE,
  [PLANKS]: I_PLANKS,
  [TORCH]: I_TORCH,
  [CRAFTING_TABLE]: I_CRAFTING_TABLE,
  [FURNACE]: I_FURNACE,
  [COAL_ORE]: I_COAL,
  [IRON_ORE]: I_RAW_IRON,
  [GOLD_ORE]: I_RAW_GOLD,
  [DIAMOND_ORE]: I_DIAMOND,
  [REDSTONE_ORE]: I_REDSTONE,
  // LEAVES intentionally drop nothing (sapling chance comes later).
};

/** Item id a block yields when mined, or null for no drop. */
export function blockDrop(blockId: number): number | null {
  return BLOCK_DROPS[blockId] ?? null;
}
