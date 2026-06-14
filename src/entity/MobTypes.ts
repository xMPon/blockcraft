// Mob definitions: boxy part lists, stats, and loot tables for the seven mobs.
// Passive animals wander and flee; hostiles seek the player (creeper explodes).
import type { MobType } from "./Mob";
import {
  I_RAW_PORK, I_RAW_BEEF, I_RAW_MUTTON, I_RAW_CHICKEN,
  I_LEATHER, I_WOOL, I_FEATHER, I_STRING, I_GUNPOWDER,
} from "../item/Item";

export const PIG: MobType = {
  name: "pig", hostile: false, health: 10, speed: 1.0, halfW: 0.45, height: 0.9,
  parts: [
    { w: 0.6, h: 0.5, d: 0.95, x: 0, y: 0.6, z: 0, color: 0xdda0a8 },
    { w: 0.45, h: 0.45, d: 0.4, x: 0, y: 0.62, z: -0.62, color: 0xdda0a8 },
    { w: 0.2, h: 0.16, d: 0.12, x: 0, y: 0.55, z: -0.86, color: 0xc77f88 },
    { w: 0.18, h: 0.4, d: 0.18, x: -0.18, y: 0.2, z: 0.32, color: 0xc77f88, leg: true },
    { w: 0.18, h: 0.4, d: 0.18, x: 0.18, y: 0.2, z: 0.32, color: 0xc77f88, leg: true },
    { w: 0.18, h: 0.4, d: 0.18, x: -0.18, y: 0.2, z: -0.32, color: 0xc77f88, leg: true },
    { w: 0.18, h: 0.4, d: 0.18, x: 0.18, y: 0.2, z: -0.32, color: 0xc77f88, leg: true },
  ],
  loot: [{ item: I_RAW_PORK, min: 1, max: 3 }],
};

export const COW: MobType = {
  name: "cow", hostile: false, health: 10, speed: 0.9, halfW: 0.5, height: 1.0,
  parts: [
    { w: 0.7, h: 0.6, d: 1.05, x: 0, y: 0.65, z: 0, color: 0x4a3a2a },
    { w: 0.5, h: 0.5, d: 0.45, x: 0, y: 0.7, z: -0.68, color: 0x4a3a2a },
    { w: 0.3, h: 0.2, d: 0.1, x: 0, y: 0.62, z: -0.93, color: 0xdac7b0 },
    { w: 0.2, h: 0.45, d: 0.2, x: -0.22, y: 0.225, z: 0.36, color: 0x3a2c1f, leg: true },
    { w: 0.2, h: 0.45, d: 0.2, x: 0.22, y: 0.225, z: 0.36, color: 0x3a2c1f, leg: true },
    { w: 0.2, h: 0.45, d: 0.2, x: -0.22, y: 0.225, z: -0.36, color: 0x3a2c1f, leg: true },
    { w: 0.2, h: 0.45, d: 0.2, x: 0.22, y: 0.225, z: -0.36, color: 0x3a2c1f, leg: true },
  ],
  loot: [{ item: I_RAW_BEEF, min: 1, max: 3 }, { item: I_LEATHER, min: 0, max: 2 }],
};

export const SHEEP: MobType = {
  name: "sheep", hostile: false, health: 8, speed: 1.0, halfW: 0.5, height: 1.0,
  parts: [
    { w: 0.75, h: 0.7, d: 0.95, x: 0, y: 0.7, z: 0, color: 0xe6e2da },
    { w: 0.4, h: 0.4, d: 0.4, x: 0, y: 0.7, z: -0.62, color: 0xddd3c2 },
    { w: 0.18, h: 0.45, d: 0.18, x: -0.2, y: 0.225, z: 0.32, color: 0x4a4540, leg: true },
    { w: 0.18, h: 0.45, d: 0.18, x: 0.2, y: 0.225, z: 0.32, color: 0x4a4540, leg: true },
    { w: 0.18, h: 0.45, d: 0.18, x: -0.2, y: 0.225, z: -0.32, color: 0x4a4540, leg: true },
    { w: 0.18, h: 0.45, d: 0.18, x: 0.2, y: 0.225, z: -0.32, color: 0x4a4540, leg: true },
  ],
  loot: [{ item: I_RAW_MUTTON, min: 1, max: 2 }, { item: I_WOOL, min: 1, max: 1 }],
};

export const CHICKEN: MobType = {
  name: "chicken", hostile: false, health: 4, speed: 1.0, halfW: 0.25, height: 0.6,
  parts: [
    { w: 0.35, h: 0.38, d: 0.42, x: 0, y: 0.32, z: 0, color: 0xf2f2f2 },
    { w: 0.26, h: 0.26, d: 0.26, x: 0, y: 0.62, z: -0.18, color: 0xf2f2f2 },
    { w: 0.12, h: 0.08, d: 0.12, x: 0, y: 0.6, z: -0.34, color: 0xe0a030 },
    { w: 0.1, h: 0.2, d: 0.1, x: -0.1, y: 0.1, z: 0, color: 0xe0a030, leg: true },
    { w: 0.1, h: 0.2, d: 0.1, x: 0.1, y: 0.1, z: 0, color: 0xe0a030, leg: true },
  ],
  loot: [{ item: I_RAW_CHICKEN, min: 1, max: 1 }, { item: I_FEATHER, min: 0, max: 2 }],
};

export const ZOMBIE: MobType = {
  name: "zombie", hostile: true, health: 20, speed: 1.05, halfW: 0.3, height: 1.85, attack: 3, detect: 18,
  parts: [
    { w: 0.5, h: 0.6, d: 0.28, x: 0, y: 1.05, z: 0, color: 0x3a6a3a },
    { w: 0.45, h: 0.45, d: 0.45, x: 0, y: 1.6, z: 0, color: 0x5aa05a },
    { w: 0.16, h: 0.5, d: 0.18, x: -0.36, y: 1.1, z: -0.12, color: 0x5aa05a },
    { w: 0.16, h: 0.5, d: 0.18, x: 0.36, y: 1.1, z: -0.12, color: 0x5aa05a },
    { w: 0.22, h: 0.75, d: 0.25, x: -0.13, y: 0.375, z: 0, color: 0x2a3a6a, leg: true },
    { w: 0.22, h: 0.75, d: 0.25, x: 0.13, y: 0.375, z: 0, color: 0x2a3a6a, leg: true },
  ],
  loot: [{ item: I_FEATHER, min: 0, max: 1, chance: 0.3 }],
};

export const SPIDER: MobType = {
  name: "spider", hostile: true, health: 16, speed: 1.6, halfW: 0.5, height: 0.7, attack: 3, detect: 14,
  parts: [
    { w: 0.55, h: 0.4, d: 0.7, x: 0, y: 0.4, z: 0.05, color: 0x2a2422 },
    { w: 0.45, h: 0.38, d: 0.4, x: 0, y: 0.4, z: -0.5, color: 0x35251f },
    { w: 0.12, h: 0.3, d: 0.12, x: -0.45, y: 0.18, z: 0.25, color: 0x171311, leg: true },
    { w: 0.12, h: 0.3, d: 0.12, x: 0.45, y: 0.18, z: 0.25, color: 0x171311, leg: true },
    { w: 0.12, h: 0.3, d: 0.12, x: -0.45, y: 0.18, z: -0.25, color: 0x171311, leg: true },
    { w: 0.12, h: 0.3, d: 0.12, x: 0.45, y: 0.18, z: -0.25, color: 0x171311, leg: true },
  ],
  loot: [{ item: I_STRING, min: 0, max: 2 }],
};

export const CREEPER: MobType = {
  name: "creeper", hostile: true, health: 20, speed: 1.0, halfW: 0.32, height: 1.7, special: "creeper", detect: 14,
  parts: [
    { w: 0.55, h: 1.1, d: 0.4, x: 0, y: 0.85, z: 0, color: 0x5aaa4a },
    { w: 0.5, h: 0.5, d: 0.5, x: 0, y: 1.5, z: 0, color: 0x6abb55 },
    { w: 0.24, h: 0.28, d: 0.24, x: -0.18, y: 0.14, z: 0.18, color: 0x4a8a3a, leg: true },
    { w: 0.24, h: 0.28, d: 0.24, x: 0.18, y: 0.14, z: 0.18, color: 0x4a8a3a, leg: true },
    { w: 0.24, h: 0.28, d: 0.24, x: -0.18, y: 0.14, z: -0.18, color: 0x4a8a3a, leg: true },
    { w: 0.24, h: 0.28, d: 0.24, x: 0.18, y: 0.14, z: -0.18, color: 0x4a8a3a, leg: true },
  ],
  loot: [{ item: I_GUNPOWDER, min: 0, max: 2 }],
};

export const PASSIVE_MOBS: MobType[] = [PIG, COW, SHEEP, CHICKEN];
export const HOSTILE_MOBS: MobType[] = [ZOMBIE, SPIDER, CREEPER];
