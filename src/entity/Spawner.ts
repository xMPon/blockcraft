// Spawner: periodically spawns mobs on solid ground in a ring around the player.
// Hostiles appear in darkness (night, caves), passives in daylight. Capped per
// kind. The light gate is pure and unit-tested.
import * as THREE from "three";
import { Mob } from "./Mob";
import { PASSIVE_MOBS, HOSTILE_MOBS } from "./MobTypes";
import { isSolid } from "../world/Block";
import { CHUNK_Y } from "../world/Chunk";

const PASSIVE_CAP = 10;
const HOSTILE_CAP = 20;
const ATTEMPT_INTERVAL = 3; // seconds between spawn attempts
const MIN_RING = 16;
const MAX_RING = 40;

interface SpawnWorld {
  getBlock(wx: number, wy: number, wz: number): number;
  getLight(wx: number, wy: number, wz: number): { sky: number; block: number };
}

/** Effective brightness 0–15: block light, or sky light scaled by daylight. */
export function effectiveLight(light: { sky: number; block: number }, dayFactor: number): number {
  return Math.max(light.block, light.sky * dayFactor);
}

/** Hostiles spawn in the dark; passive animals need decent light. */
export function canSpawn(brightness: number, hostile: boolean): boolean {
  return hostile ? brightness < 6 : brightness >= 8;
}

export class Spawner {
  private timer = ATTEMPT_INTERVAL;

  update(
    dt: number, world: SpawnWorld, playerPos: THREE.Vector3, dayFactor: number,
    mobs: Mob[], addMob: (mob: Mob) => void,
  ): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = ATTEMPT_INTERVAL;

    let passives = 0;
    let hostiles = 0;
    for (const m of mobs) m.type.hostile ? hostiles++ : passives++;

    for (let attempt = 0; attempt < 6; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const r = MIN_RING + Math.random() * (MAX_RING - MIN_RING);
      const x = Math.floor(playerPos.x + Math.cos(ang) * r);
      const z = Math.floor(playerPos.z + Math.sin(ang) * r);

      // Find ground: the highest solid block with two air blocks above it.
      const top = Math.min(CHUNK_Y - 3, Math.floor(playerPos.y) + 24);
      const bottom = Math.max(2, Math.floor(playerPos.y) - 28);
      let groundY = -1;
      for (let y = top; y >= bottom; y--) {
        if (isSolid(world.getBlock(x, y, z)) && world.getBlock(x, y + 1, z) === 0 && world.getBlock(x, y + 2, z) === 0) {
          groundY = y + 1;
          break;
        }
      }
      if (groundY < 0) continue;

      const brightness = effectiveLight(world.getLight(x, groundY, z), dayFactor);
      const hostile = brightness < 6;
      if (!canSpawn(brightness, hostile)) continue;
      if (hostile && hostiles >= HOSTILE_CAP) continue;
      if (!hostile && passives >= PASSIVE_CAP) continue;

      const pool = hostile ? HOSTILE_MOBS : PASSIVE_MOBS;
      const type = pool[Math.floor(Math.random() * pool.length)];
      addMob(new Mob(type, x + 0.5, groundY, z + 0.5));
      return; // at most one spawn per attempt cycle
    }
  }
}
