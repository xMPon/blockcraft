// Greedy rectangle merging.
import { describe, expect, it } from "vitest";
import { greedyRects } from "../src/world/greedy";

function mask(rows: number[][]): { m: Int32Array; U: number; V: number } {
  const V = rows.length;
  const U = rows[0].length;
  const m = new Int32Array(U * V);
  for (let v = 0; v < V; v++) for (let u = 0; u < U; u++) m[u + v * U] = rows[v][u];
  return { m, U, V };
}

describe("greedyRects", () => {
  it("merges a uniform block into a single rectangle", () => {
    const { m, U, V } = mask([
      [5, 5, 5],
      [5, 5, 5],
    ]);
    expect(greedyRects(m, U, V)).toEqual([{ u: 0, v: 0, w: 3, h: 2, key: 5 }]);
  });

  it("ignores empty (0) cells", () => {
    const { m, U, V } = mask([
      [0, 0],
      [0, 0],
    ]);
    expect(greedyRects(m, U, V)).toEqual([]);
  });

  it("splits differing keys into separate rectangles", () => {
    const { m, U, V } = mask([
      [1, 1, 2],
      [1, 1, 2],
    ]);
    expect(greedyRects(m, U, V)).toEqual([
      { u: 0, v: 0, w: 2, h: 2, key: 1 },
      { u: 2, v: 0, w: 1, h: 2, key: 2 },
    ]);
  });

  it("covers every non-zero cell exactly once", () => {
    const { m, U, V } = mask([
      [1, 2, 2],
      [1, 3, 0],
      [1, 3, 4],
    ]);
    const rects = greedyRects(m, U, V);
    let covered = 0;
    for (const r of rects) covered += r.w * r.h;
    expect(covered).toBe(8); // 9 cells minus the single 0
    // First column of 1s merges vertically.
    expect(rects).toContainEqual({ u: 0, v: 0, w: 1, h: 3, key: 1 });
  });
});
