// Phase 4 logic: combat damage, hunger drain/regen/starve, spawn light gate,
// and creeper blast geometry.
import { describe, expect, it } from "vitest";
import { attackDamage } from "../src/player/Combat";
import { Hunger } from "../src/player/Hunger";
import { effectiveLight, canSpawn } from "../src/entity/Spawner";
import { blastOffsets } from "../src/entity/Mob";
import { I_IRON_SWORD, I_WOOD_SWORD, I_STONE_PICKAXE, I_RAW_PORK } from "../src/item/Item";

describe("attackDamage", () => {
  it("scales with weapon: fist < pickaxe < wood sword < iron sword", () => {
    expect(attackDamage(null)).toBe(1);
    expect(attackDamage({ item: I_STONE_PICKAXE, count: 1 })).toBe(2);
    expect(attackDamage({ item: I_WOOD_SWORD, count: 1 })).toBe(4);
    expect(attackDamage({ item: I_IRON_SWORD, count: 1 })).toBe(6);
  });
});

describe("Hunger", () => {
  it("drops a point per exhaustion threshold", () => {
    const h = new Hunger();
    h.addExhaustion(4);
    expect(h.value).toBe(19);
    h.addExhaustion(8);
    expect(h.value).toBe(17);
  });

  it("eating refills and clamps to max", () => {
    const h = new Hunger();
    h.addExhaustion(40); // -10
    expect(h.value).toBe(10);
    h.eat(I_RAW_PORK > 0 ? 3 : 0);
    expect(h.value).toBe(13);
    h.eat(50);
    expect(h.value).toBe(h.max);
  });

  it("heals a well-fed player and starves an empty one", () => {
    const player = { health: 10, maxHealth: 20, heal(n: number) { this.health += n; }, hurt(n: number) { this.health -= n; } };
    const fed = new Hunger();
    fed.tick(4, player); // value 20 ≥ threshold → heal
    expect(player.health).toBe(11);

    const starving = new Hunger();
    starving.addExhaustion(80); // value 0
    player.health = 5;
    starving.tick(4, player);
    expect(player.health).toBe(4);
  });
});

describe("spawn light gate", () => {
  it("uses block light or daylight-scaled sky light", () => {
    expect(effectiveLight({ sky: 15, block: 0 }, 1)).toBe(15); // daytime surface
    expect(effectiveLight({ sky: 15, block: 0 }, 0.12)).toBeCloseTo(1.8); // night
    expect(effectiveLight({ sky: 0, block: 14 }, 1)).toBe(14); // torch-lit cave
  });

  it("hostiles need darkness, passives need light", () => {
    expect(canSpawn(2, true)).toBe(true);
    expect(canSpawn(10, true)).toBe(false);
    expect(canSpawn(10, false)).toBe(true);
    expect(canSpawn(2, false)).toBe(false);
  });
});

describe("blastOffsets", () => {
  it("returns only cells within the sphere radius and includes the centre", () => {
    const cells = blastOffsets(3);
    expect(cells.some(([x, y, z]) => x === 0 && y === 0 && z === 0)).toBe(true);
    expect(cells.every(([x, y, z]) => x * x + y * y + z * z <= 9)).toBe(true);
    expect(cells.some(([x, y, z]) => x * x + y * y + z * z > 9)).toBe(false);
    expect(cells.length).toBeGreaterThan(100);
  });
});
