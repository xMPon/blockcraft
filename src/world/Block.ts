// Block registry: ids, collision/culling flags, atlas tiles, and the
// survival metadata (hardness, tool, tier, light) consumed by later phases.
// Ids are stable contracts (saved worlds depend on them) — append, never renumber.
export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const SAND = 4;
export const WOOD = 5; // log / tree trunk
export const LEAVES = 6;
export const WATER = 7;
export const BEDROCK = 8;
export const COBBLESTONE = 9;
export const PLANKS = 10;
export const GRAVEL = 11;
export const LAVA = 12;
export const COAL_ORE = 13;
export const IRON_ORE = 14;
export const GOLD_ORE = 15;
export const DIAMOND_ORE = 16;
export const REDSTONE_ORE = 17;

/** Which geometry bucket a block meshes into. */
export type MeshLayer = "solid" | "cutout" | "water";

/** Tool that mines a block fastest (and may gate whether it drops anything). */
export type ToolKind = "none" | "pickaxe" | "axe" | "shovel" | "sword";

// Material tiers, shared by tools and the minTier drop gate.
export const TIER_NONE = 0;
export const TIER_WOOD = 1;
export const TIER_STONE = 2;
export const TIER_IRON = 3;
export const TIER_DIAMOND = 4;

export interface BlockDef {
  id: number;
  name: string;
  /** Blocks player movement and is targetable by the block-edit raycast. */
  solid: boolean;
  /** Hides the touching faces of adjacent blocks when meshing. */
  opaque: boolean;
  /** Geometry bucket — solid/cutout share the opaque pass distinction via `opaque`. */
  layer: MeshLayer;
  /** Atlas tile index per face group: [top, side, bottom]. */
  tiles: [number, number, number];
  /** Hotbar / inventory swatch colour. */
  color: string;
  /** Relative mining time; Infinity = unbreakable. Consumed by hold-to-mine (Phase 3a). */
  hardness: number;
  /** Tool that mines this fastest. */
  tool: ToolKind;
  /** Minimum tool tier required for the block to drop anything. */
  minTier: number;
  /** Light level emitted, 0–15 (Phase 2 lighting). */
  light: number;
}

// Defaults keep new entries terse; only override what differs.
function def(d: Partial<BlockDef> & Pick<BlockDef, "id" | "name" | "tiles">): BlockDef {
  return {
    solid: true,
    opaque: true,
    layer: "solid",
    color: "#888888",
    hardness: 1,
    tool: "none",
    minTier: TIER_NONE,
    light: 0,
    ...d,
  };
}

export const BLOCKS: BlockDef[] = [
  def({ id: AIR, name: "air", solid: false, opaque: false, tiles: [0, 0, 0], color: "transparent", hardness: 0 }),
  def({ id: GRASS, name: "grass", tiles: [0, 1, 2], color: "#5d9e3a", hardness: 0.6, tool: "shovel" }),
  def({ id: DIRT, name: "dirt", tiles: [2, 2, 2], color: "#79553a", hardness: 0.5, tool: "shovel" }),
  def({ id: STONE, name: "stone", tiles: [3, 3, 3], color: "#8a8a8a", hardness: 1.5, tool: "pickaxe", minTier: TIER_WOOD }),
  def({ id: SAND, name: "sand", tiles: [4, 4, 4], color: "#d8cc8a", hardness: 0.5, tool: "shovel" }),
  def({ id: WOOD, name: "log", tiles: [6, 5, 6], color: "#6b4a2a", hardness: 2, tool: "axe" }),
  def({ id: LEAVES, name: "leaves", opaque: false, layer: "cutout", tiles: [7, 7, 7], color: "#3e7a25", hardness: 0.2 }),
  def({ id: WATER, name: "water", solid: false, opaque: false, layer: "water", tiles: [8, 8, 8], color: "#3d6fd1", hardness: Infinity }),
  def({ id: BEDROCK, name: "bedrock", tiles: [9, 9, 9], color: "#2b2b2b", hardness: Infinity }),
  def({ id: COBBLESTONE, name: "cobblestone", tiles: [10, 10, 10], color: "#7a7a7a", hardness: 2, tool: "pickaxe", minTier: TIER_WOOD }),
  def({ id: PLANKS, name: "planks", tiles: [11, 11, 11], color: "#b9925a", hardness: 2, tool: "axe" }),
  def({ id: GRAVEL, name: "gravel", tiles: [12, 12, 12], color: "#8a8076", hardness: 0.6, tool: "shovel" }),
  def({ id: LAVA, name: "lava", solid: false, tiles: [13, 13, 13], color: "#e2622a", hardness: Infinity, light: 15 }),
  def({ id: COAL_ORE, name: "coal ore", tiles: [14, 14, 14], color: "#3a3a3a", hardness: 3, tool: "pickaxe", minTier: TIER_WOOD }),
  def({ id: IRON_ORE, name: "iron ore", tiles: [15, 15, 15], color: "#caa17e", hardness: 3, tool: "pickaxe", minTier: TIER_STONE }),
  def({ id: GOLD_ORE, name: "gold ore", tiles: [16, 16, 16], color: "#e6c558", hardness: 3, tool: "pickaxe", minTier: TIER_IRON }),
  def({ id: DIAMOND_ORE, name: "diamond ore", tiles: [17, 17, 17], color: "#52d9d0", hardness: 3, tool: "pickaxe", minTier: TIER_IRON }),
  def({ id: REDSTONE_ORE, name: "redstone ore", tiles: [18, 18, 18], color: "#c83a2a", hardness: 3, tool: "pickaxe", minTier: TIER_IRON }),
];

/** Blocks offered in the test hotbar, in slot order. */
export const PLACEABLE: number[] = [GRASS, DIRT, STONE, COBBLESTONE, PLANKS, SAND, WOOD, LEAVES];

export function isSolid(id: number): boolean {
  return BLOCKS[id].solid;
}

export function isOpaque(id: number): boolean {
  return BLOCKS[id].opaque;
}

export function meshLayer(id: number): MeshLayer {
  return BLOCKS[id].layer;
}

export function lightEmission(id: number): number {
  return BLOCKS[id].light;
}
