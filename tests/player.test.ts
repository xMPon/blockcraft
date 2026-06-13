// Fall-damage curve: no damage within the safe fall, then 1 HP per extra block.
import { describe, expect, it } from "vitest";
import { fallDamage } from "../src/player/Player";

describe("fallDamage", () => {
  it("absorbs falls up to the safe height", () => {
    expect(fallDamage(0)).toBe(0);
    expect(fallDamage(3)).toBe(0);
  });

  it("deals 1 HP per block past the safe height", () => {
    expect(fallDamage(4)).toBe(1);
    expect(fallDamage(7)).toBe(4);
    expect(fallDamage(23)).toBe(20); // a lethal fall
  });
});
