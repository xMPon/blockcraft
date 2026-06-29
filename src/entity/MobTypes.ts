// Mob definitions: boxy part lists, stats, and loot tables. Beyond body/head/
// legs each mob carries detail parts — eyes, snouts, ears, horns, tails, the
// creeper face — so the creatures read as characters, not plain blocks.
import type { MobType } from "./Mob";
import {
  I_RAW_PORK, I_RAW_BEEF, I_RAW_MUTTON, I_RAW_CHICKEN,
  I_LEATHER, I_WOOL, I_FEATHER, I_STRING, I_GUNPOWDER, I_BONE,
} from "../item/Item";

const EYE = 0x14110e; // dark eye
const RED_EYE = 0xc8302a;

export const PIG: MobType = {
  name: "pig", hostile: false, health: 10, speed: 1.0, halfW: 0.45, height: 0.9,
  parts: [
    { w: 0.6, h: 0.5, d: 0.95, x: 0, y: 0.6, z: 0, color: 0xe39aa6 },
    { w: 0.07, h: 0.07, d: 0.12, x: 0, y: 0.62, z: 0.52, color: 0xd07f8b }, // tail
    { w: 0.45, h: 0.45, d: 0.4, x: 0, y: 0.62, z: -0.62, color: 0xe39aa6 }, // head
    { w: 0.24, h: 0.18, d: 0.1, x: 0, y: 0.54, z: -0.85, color: 0xd07f8b }, // snout
    { w: 0.05, h: 0.06, d: 0.04, x: -0.06, y: 0.54, z: -0.9, color: 0x5e3239 }, // nostrils
    { w: 0.05, h: 0.06, d: 0.04, x: 0.06, y: 0.54, z: -0.9, color: 0x5e3239 },
    { w: 0.08, h: 0.09, d: 0.04, x: -0.13, y: 0.72, z: -0.82, color: EYE }, // eyes
    { w: 0.08, h: 0.09, d: 0.04, x: 0.13, y: 0.72, z: -0.82, color: EYE },
    { w: 0.11, h: 0.12, d: 0.05, x: -0.14, y: 0.86, z: -0.56, color: 0xd07f8b }, // ears
    { w: 0.11, h: 0.12, d: 0.05, x: 0.14, y: 0.86, z: -0.56, color: 0xd07f8b },
    { w: 0.18, h: 0.4, d: 0.18, x: -0.18, y: 0.2, z: 0.32, color: 0xcf6f82, leg: true },
    { w: 0.18, h: 0.4, d: 0.18, x: 0.18, y: 0.2, z: 0.32, color: 0xcf6f82, leg: true },
    { w: 0.18, h: 0.4, d: 0.18, x: -0.18, y: 0.2, z: -0.32, color: 0xcf6f82, leg: true },
    { w: 0.18, h: 0.4, d: 0.18, x: 0.18, y: 0.2, z: -0.32, color: 0xcf6f82, leg: true },
  ],
  loot: [{ item: I_RAW_PORK, min: 1, max: 3 }],
};

export const COW: MobType = {
  name: "cow", hostile: false, health: 10, speed: 0.9, halfW: 0.5, height: 1.0,
  parts: [
    { w: 0.7, h: 0.6, d: 1.05, x: 0, y: 0.65, z: 0, color: 0x4a3a2a },
    { w: 0.5, h: 0.36, d: 0.5, x: 0.06, y: 0.82, z: 0.1, color: 0xe8e2d6 }, // white patch
    { w: 0.05, h: 0.34, d: 0.05, x: 0, y: 0.45, z: 0.55, color: 0x3a2c1f }, // tail
    { w: 0.5, h: 0.5, d: 0.45, x: 0, y: 0.7, z: -0.68, color: 0x4a3a2a }, // head
    { w: 0.34, h: 0.22, d: 0.1, x: 0, y: 0.6, z: -0.93, color: 0xc9a98a }, // snout
    { w: 0.05, h: 0.06, d: 0.04, x: -0.08, y: 0.58, z: -0.98, color: 0x2a2018 },
    { w: 0.05, h: 0.06, d: 0.04, x: 0.08, y: 0.58, z: -0.98, color: 0x2a2018 },
    { w: 0.08, h: 0.09, d: 0.04, x: -0.15, y: 0.82, z: -0.91, color: EYE }, // eyes
    { w: 0.08, h: 0.09, d: 0.04, x: 0.15, y: 0.82, z: -0.91, color: EYE },
    { w: 0.08, h: 0.14, d: 0.08, x: -0.2, y: 0.98, z: -0.62, color: 0xeae0c6 }, // horns
    { w: 0.08, h: 0.14, d: 0.08, x: 0.2, y: 0.98, z: -0.62, color: 0xeae0c6 },
    { w: 0.13, h: 0.08, d: 0.08, x: -0.3, y: 0.82, z: -0.6, color: 0x4a3a2a }, // ears
    { w: 0.13, h: 0.08, d: 0.08, x: 0.3, y: 0.82, z: -0.6, color: 0x4a3a2a },
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
    { w: 0.8, h: 0.74, d: 1.0, x: 0, y: 0.74, z: 0, color: 0xeae6de }, // fluffy wool body
    { w: 0.4, h: 0.42, d: 0.4, x: 0, y: 0.7, z: -0.62, color: 0x4a4540 }, // dark face
    { w: 0.34, h: 0.3, d: 0.16, x: 0, y: 0.78, z: -0.74, color: 0xeae6de }, // wool tuft
    { w: 0.06, h: 0.07, d: 0.04, x: -0.1, y: 0.72, z: -0.82, color: EYE }, // eyes
    { w: 0.06, h: 0.07, d: 0.04, x: 0.1, y: 0.72, z: -0.82, color: EYE },
    { w: 0.08, h: 0.06, d: 0.12, x: -0.24, y: 0.7, z: -0.58, color: 0x4a4540 }, // ears
    { w: 0.08, h: 0.06, d: 0.12, x: 0.24, y: 0.7, z: -0.58, color: 0x4a4540 },
    { w: 0.16, h: 0.45, d: 0.16, x: -0.2, y: 0.225, z: 0.32, color: 0x3a3631, leg: true },
    { w: 0.16, h: 0.45, d: 0.16, x: 0.2, y: 0.225, z: 0.32, color: 0x3a3631, leg: true },
    { w: 0.16, h: 0.45, d: 0.16, x: -0.2, y: 0.225, z: -0.32, color: 0x3a3631, leg: true },
    { w: 0.16, h: 0.45, d: 0.16, x: 0.2, y: 0.225, z: -0.32, color: 0x3a3631, leg: true },
  ],
  loot: [{ item: I_RAW_MUTTON, min: 1, max: 2 }, { item: I_WOOL, min: 1, max: 1 }],
};

export const CHICKEN: MobType = {
  name: "chicken", hostile: false, health: 4, speed: 1.0, halfW: 0.25, height: 0.6,
  parts: [
    { w: 0.36, h: 0.4, d: 0.45, x: 0, y: 0.34, z: 0, color: 0xf2f2f2 },
    { w: 0.05, h: 0.22, d: 0.3, x: -0.2, y: 0.36, z: 0, color: 0xe8e8e8 }, // wings
    { w: 0.05, h: 0.22, d: 0.3, x: 0.2, y: 0.36, z: 0, color: 0xe8e8e8 },
    { w: 0.22, h: 0.2, d: 0.12, x: 0, y: 0.46, z: 0.24, color: 0xe8e8e8 }, // tail
    { w: 0.26, h: 0.26, d: 0.26, x: 0, y: 0.64, z: -0.18, color: 0xf2f2f2 }, // head
    { w: 0.12, h: 0.08, d: 0.12, x: 0, y: 0.62, z: -0.34, color: 0xe0a030 }, // beak
    { w: 0.06, h: 0.08, d: 0.04, x: 0, y: 0.54, z: -0.31, color: 0xcc3333 }, // wattle
    { w: 0.06, h: 0.09, d: 0.16, x: 0, y: 0.8, z: -0.14, color: 0xcc3333 }, // comb
    { w: 0.05, h: 0.05, d: 0.03, x: -0.09, y: 0.67, z: -0.31, color: EYE }, // eyes
    { w: 0.05, h: 0.05, d: 0.03, x: 0.09, y: 0.67, z: -0.31, color: EYE },
    { w: 0.08, h: 0.2, d: 0.08, x: -0.1, y: 0.1, z: 0, color: 0xe0a030, leg: true },
    { w: 0.08, h: 0.2, d: 0.08, x: 0.1, y: 0.1, z: 0, color: 0xe0a030, leg: true },
  ],
  loot: [{ item: I_RAW_CHICKEN, min: 1, max: 1 }, { item: I_FEATHER, min: 0, max: 2 }],
};

export const ZOMBIE: MobType = {
  name: "zombie", hostile: true, health: 20, speed: 1.05, halfW: 0.3, height: 1.85, attack: 3, detect: 18,
  parts: [
    { w: 0.5, h: 0.6, d: 0.28, x: 0, y: 1.05, z: 0, color: 0x3a6a3a }, // torso (shirt)
    { w: 0.45, h: 0.45, d: 0.45, x: 0, y: 1.6, z: 0, color: 0x5aa05a }, // head
    { w: 0.1, h: 0.07, d: 0.04, x: -0.11, y: 1.64, z: -0.23, color: 0x14241a }, // sunken eyes
    { w: 0.1, h: 0.07, d: 0.04, x: 0.11, y: 1.64, z: -0.23, color: 0x14241a },
    { w: 0.22, h: 0.04, d: 0.03, x: 0, y: 1.5, z: -0.23, color: 0x14241a }, // mouth
    { w: 0.16, h: 0.16, d: 0.5, x: -0.28, y: 1.2, z: -0.32, color: 0x5aa05a }, // arms out
    { w: 0.16, h: 0.16, d: 0.5, x: 0.28, y: 1.2, z: -0.32, color: 0x5aa05a },
    { w: 0.22, h: 0.75, d: 0.25, x: -0.13, y: 0.375, z: 0, color: 0x2a3a6a, leg: true },
    { w: 0.22, h: 0.75, d: 0.25, x: 0.13, y: 0.375, z: 0, color: 0x2a3a6a, leg: true },
  ],
  loot: [{ item: I_FEATHER, min: 0, max: 1, chance: 0.3 }],
};

export const SPIDER: MobType = {
  name: "spider", hostile: true, health: 16, speed: 1.6, halfW: 0.5, height: 0.7, attack: 3, detect: 14,
  parts: [
    { w: 0.62, h: 0.44, d: 0.7, x: 0, y: 0.42, z: 0.12, color: 0x2a2422 }, // abdomen
    { w: 0.45, h: 0.38, d: 0.4, x: 0, y: 0.4, z: -0.5, color: 0x35251f }, // head
    { w: 0.07, h: 0.07, d: 0.04, x: -0.1, y: 0.48, z: -0.7, color: RED_EYE }, // red eyes
    { w: 0.07, h: 0.07, d: 0.04, x: 0.1, y: 0.48, z: -0.7, color: RED_EYE },
    { w: 0.05, h: 0.05, d: 0.04, x: -0.17, y: 0.42, z: -0.7, color: RED_EYE },
    { w: 0.05, h: 0.05, d: 0.04, x: 0.17, y: 0.42, z: -0.7, color: RED_EYE },
    { w: 0.07, h: 0.08, d: 0.07, x: -0.08, y: 0.32, z: -0.72, color: 0x1a1410 }, // mandibles
    { w: 0.07, h: 0.08, d: 0.07, x: 0.08, y: 0.32, z: -0.72, color: 0x1a1410 },
    { w: 0.1, h: 0.28, d: 0.1, x: -0.46, y: 0.18, z: -0.18, color: 0x1c1714, leg: true }, // 6 legs
    { w: 0.1, h: 0.28, d: 0.1, x: 0.46, y: 0.18, z: -0.18, color: 0x1c1714, leg: true },
    { w: 0.1, h: 0.28, d: 0.1, x: -0.46, y: 0.18, z: 0.12, color: 0x1c1714, leg: true },
    { w: 0.1, h: 0.28, d: 0.1, x: 0.46, y: 0.18, z: 0.12, color: 0x1c1714, leg: true },
    { w: 0.1, h: 0.28, d: 0.1, x: -0.46, y: 0.18, z: 0.4, color: 0x1c1714, leg: true },
    { w: 0.1, h: 0.28, d: 0.1, x: 0.46, y: 0.18, z: 0.4, color: 0x1c1714, leg: true },
  ],
  loot: [{ item: I_STRING, min: 0, max: 2 }],
};

export const CREEPER: MobType = {
  name: "creeper", hostile: true, health: 20, speed: 1.0, halfW: 0.32, height: 1.7, special: "creeper", detect: 14,
  parts: [
    { w: 0.55, h: 1.1, d: 0.4, x: 0, y: 0.85, z: 0, color: 0x5aaa4a }, // body
    { w: 0.5, h: 0.5, d: 0.5, x: 0, y: 1.5, z: 0, color: 0x6abb55 }, // head
    { w: 0.13, h: 0.13, d: 0.04, x: -0.13, y: 1.56, z: -0.25, color: 0x0e1a0c }, // face: eyes
    { w: 0.13, h: 0.13, d: 0.04, x: 0.13, y: 1.56, z: -0.25, color: 0x0e1a0c },
    { w: 0.12, h: 0.2, d: 0.04, x: 0, y: 1.43, z: -0.25, color: 0x0e1a0c }, // mouth column
    { w: 0.11, h: 0.11, d: 0.04, x: -0.13, y: 1.39, z: -0.25, color: 0x0e1a0c }, // mouth corners
    { w: 0.11, h: 0.11, d: 0.04, x: 0.13, y: 1.39, z: -0.25, color: 0x0e1a0c },
    { w: 0.24, h: 0.28, d: 0.24, x: -0.18, y: 0.14, z: 0.18, color: 0x4a8a3a, leg: true },
    { w: 0.24, h: 0.28, d: 0.24, x: 0.18, y: 0.14, z: 0.18, color: 0x4a8a3a, leg: true },
    { w: 0.24, h: 0.28, d: 0.24, x: -0.18, y: 0.14, z: -0.18, color: 0x4a8a3a, leg: true },
    { w: 0.24, h: 0.28, d: 0.24, x: 0.18, y: 0.14, z: -0.18, color: 0x4a8a3a, leg: true },
  ],
  loot: [{ item: I_GUNPOWDER, min: 0, max: 2 }],
};

export const SKELETON: MobType = {
  name: "skeleton", hostile: true, health: 18, speed: 1.0, halfW: 0.3, height: 1.85, special: "skeleton", detect: 16,
  parts: [
    { w: 0.42, h: 0.55, d: 0.24, x: 0, y: 1.05, z: 0, color: 0xd8d4c4 }, // ribcage
    { w: 0.06, h: 0.5, d: 0.06, x: -0.13, y: 1.05, z: 0, color: 0xc4c0b0 }, // spine ribs hint
    { w: 0.06, h: 0.5, d: 0.06, x: 0.13, y: 1.05, z: 0, color: 0xc4c0b0 },
    { w: 0.42, h: 0.42, d: 0.42, x: 0, y: 1.58, z: 0, color: 0xe2ddcc }, // skull
    { w: 0.1, h: 0.09, d: 0.05, x: -0.1, y: 1.6, z: -0.21, color: 0x16140f }, // eye sockets
    { w: 0.1, h: 0.09, d: 0.05, x: 0.1, y: 1.6, z: -0.21, color: 0x16140f },
    { w: 0.18, h: 0.05, d: 0.04, x: 0, y: 1.46, z: -0.21, color: 0x16140f }, // jaw line
    { w: 0.11, h: 0.5, d: 0.13, x: -0.32, y: 1.12, z: -0.12, color: 0xd8d4c4 }, // arms (bow side fwd)
    { w: 0.11, h: 0.5, d: 0.13, x: 0.32, y: 1.12, z: -0.12, color: 0xd8d4c4 },
    { w: 0.05, h: 0.8, d: 0.05, x: -0.42, y: 1.12, z: -0.2, color: 0x6e4d2c }, // bow stave
    { w: 0.16, h: 0.72, d: 0.18, x: -0.11, y: 0.36, z: 0, color: 0xc8c4b4, leg: true },
    { w: 0.16, h: 0.72, d: 0.18, x: 0.11, y: 0.36, z: 0, color: 0xc8c4b4, leg: true },
  ],
  loot: [{ item: I_BONE, min: 0, max: 2 }],
};

export const PASSIVE_MOBS: MobType[] = [PIG, COW, SHEEP, CHICKEN];
export const HOSTILE_MOBS: MobType[] = [ZOMBIE, SPIDER, CREEPER, SKELETON];
