// Block registry: ids, collision/culling flags, atlas tiles, hotbar data.
// Ids are stable contracts (saved worlds depend on them) — append, never renumber.
export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const SAND = 4;
export const WOOD = 5;
export const LEAVES = 6;
export const WATER = 7;

export interface BlockDef {
  id: number;
  name: string;
  /** Blocks player movement and is targetable by the block-edit raycast. */
  solid: boolean;
  /** Hides the touching faces of adjacent blocks when meshing. */
  opaque: boolean;
  /** Atlas tile index per face group: [top, side, bottom]. */
  tiles: [number, number, number];
  /** Hotbar swatch colour. */
  color: string;
}

export const BLOCKS: BlockDef[] = [
  { id: AIR, name: "air", solid: false, opaque: false, tiles: [0, 0, 0], color: "transparent" },
  { id: GRASS, name: "grass", solid: true, opaque: true, tiles: [0, 1, 2], color: "#5d9e3a" },
  { id: DIRT, name: "dirt", solid: true, opaque: true, tiles: [2, 2, 2], color: "#79553a" },
  { id: STONE, name: "stone", solid: true, opaque: true, tiles: [3, 3, 3], color: "#8a8a8a" },
  { id: SAND, name: "sand", solid: true, opaque: true, tiles: [4, 4, 4], color: "#d8cc8a" },
  { id: WOOD, name: "wood", solid: true, opaque: true, tiles: [6, 5, 6], color: "#6b4a2a" },
  { id: LEAVES, name: "leaves", solid: true, opaque: true, tiles: [7, 7, 7], color: "#3e7a25" },
  { id: WATER, name: "water", solid: false, opaque: false, tiles: [8, 8, 8], color: "#3d6fd1" },
];

/** Blocks offered in the hotbar, in slot order. */
export const PLACEABLE: number[] = [GRASS, DIRT, STONE, SAND, WOOD, LEAVES];

export function isSolid(id: number): boolean {
  return BLOCKS[id].solid;
}

export function isOpaque(id: number): boolean {
  return BLOCKS[id].opaque;
}
