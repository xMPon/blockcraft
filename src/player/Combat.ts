// Combat: melee damage a held item deals to mobs. Pure — unit tested.
import { itemDef } from "../item/Item";
import type { ItemStack } from "../item/ItemStack";

export const PLAYER_REACH = 3.6; // how far the player can hit a mob

/** Damage dealt by the held stack: swords hardest, axes next, else a light hit. */
export function attackDamage(stack: ItemStack | null): number {
  if (!stack) return 1;
  const t = itemDef(stack.item).tool;
  if (!t) return 1;
  if (t.kind === "sword") return t.tier + 3; // wood 4 · stone 5 · iron 6
  if (t.kind === "axe") return t.tier + 2; // axes hit hard
  return 2; // pickaxe / shovel
}
