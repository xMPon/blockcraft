// Voxel DDA raycast behaviour against a lambda-defined world.
import { describe, expect, it } from "vitest";
import { raycastVoxel } from "../src/player/Raycast";

const blockAt =
  (bx: number, by: number, bz: number) => (x: number, y: number, z: number) =>
    x === bx && y === by && z === bz;

describe("raycastVoxel", () => {
  it("hits a block straight ahead with the entry face normal", () => {
    const hit = raycastVoxel(0.5, 0.5, 0.5, 1, 0, 0, 10, blockAt(5, 0, 0));
    expect(hit).toEqual({ x: 5, y: 0, z: 0, face: [-1, 0, 0] });
  });

  it("hits downward with the top face normal", () => {
    const hit = raycastVoxel(0.5, 10.5, 0.5, 0, -1, 0, 20, blockAt(0, 3, 0));
    expect(hit).toEqual({ x: 0, y: 3, z: 0, face: [0, 1, 0] });
  });

  it("walks diagonal paths cell by cell", () => {
    const visited: string[] = [];
    const hit = raycastVoxel(0.5, 0.5, 0.5, 1, 0, 1, 20, (x, y, z) => {
      visited.push(`${x},${y},${z}`);
      return x === 3 && y === 0 && z === 3;
    });
    expect(hit).toMatchObject({ x: 3, y: 0, z: 3 });
    // Every visited cell differs from the previous by exactly one axis step.
    expect(visited).toContain("3,0,3");
  });

  it("respects max distance", () => {
    expect(raycastVoxel(0.5, 0.5, 0.5, 1, 0, 0, 3, blockAt(5, 0, 0))).toBeNull();
  });

  it("returns null when nothing is hit", () => {
    expect(raycastVoxel(0.5, 0.5, 0.5, 0, 1, 0, 50, () => false)).toBeNull();
  });

  it("skips the cell containing the ray origin", () => {
    expect(raycastVoxel(0.5, 0.5, 0.5, 1, 0, 0, 10, blockAt(0, 0, 0))).toBeNull();
  });

  it("returns null for a zero-length direction", () => {
    expect(raycastVoxel(0.5, 0.5, 0.5, 0, 0, 0, 10, () => true)).toBeNull();
  });
});
