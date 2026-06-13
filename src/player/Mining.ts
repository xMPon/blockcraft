// Mining: hold-to-break timing and the harvest-tier gate (pure functions), plus
// a small stateful tracker that accumulates progress on the targeted block.
import { BLOCKS } from "../world/Block";
import { itemDef } from "../item/Item";
import type { ItemStack } from "../item/ItemStack";

export interface Tool {
  kind: string;
  tier: number;
  speed: number;
}

const MINE_TIME_SCALE = 1.5; // seconds per unit hardness when hand-mining

/** The tool descriptor a held stack provides, or null (bare hand). */
export function toolOf(stack: ItemStack | null): Tool | null {
  return stack ? itemDef(stack.item).tool ?? null : null;
}

/** Seconds to break a block with the given tool. Infinity for unbreakable. */
export function breakTime(blockId: number, tool: Tool | null): number {
  const def = BLOCKS[blockId];
  if (def.hardness === Infinity) return Infinity;
  const correct = tool != null && tool.kind === def.tool;
  const speed = correct ? tool.speed : 1;
  return Math.max(0.05, (def.hardness / speed) * MINE_TIME_SCALE);
}

/** Whether the block yields its drop with this tool (tier gate). */
export function canHarvest(blockId: number, tool: Tool | null): boolean {
  const def = BLOCKS[blockId];
  if (def.minTier === 0) return true;
  return tool != null && tool.kind === def.tool && tool.tier >= def.minTier;
}

/** Tracks break progress against the currently targeted block. */
export class MiningState {
  target: { x: number; y: number; z: number } | null = null;
  progress = 0; // 0..1

  /**
   * Advance mining. Returns true on the frame the block finishes breaking.
   * Resets progress whenever the target block changes or mining stops.
   */
  update(
    active: boolean,
    target: { x: number; y: number; z: number } | null,
    blockId: number,
    tool: Tool | null,
    dt: number,
  ): boolean {
    if (!active || !target) {
      this.target = null;
      this.progress = 0;
      return false;
    }
    if (!this.target || this.target.x !== target.x || this.target.y !== target.y || this.target.z !== target.z) {
      this.target = { ...target };
      this.progress = 0;
    }
    const time = breakTime(blockId, tool);
    if (time === Infinity) {
      this.progress = 0;
      return false;
    }
    this.progress += dt / time;
    if (this.progress >= 1) {
      this.progress = 0;
      this.target = null;
      return true;
    }
    return false;
  }
}
