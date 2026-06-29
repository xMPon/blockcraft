// Greedy rectangle merging for chunk meshing. Given a 2D mask of merge keys
// (0 = empty), returns the minimal set of axis-aligned rectangles covering equal
// keys. Pure and unit-tested; the mesher feeds it one mask per face layer.
export interface Rect {
  u: number;
  v: number;
  w: number;
  h: number;
  key: number;
}

/** Merge equal non-zero keys in a U×V mask (index = u + v*U) into rectangles. */
export function greedyRects(mask: Int32Array, U: number, V: number): Rect[] {
  const out: Rect[] = [];
  for (let v = 0; v < V; v++) {
    for (let u = 0; u < U; ) {
      const key = mask[u + v * U];
      if (key === 0) { u++; continue; }
      // Extend width along u while the key matches.
      let w = 1;
      while (u + w < U && mask[u + w + v * U] === key) w++;
      // Extend height along v while the whole w-strip matches.
      let h = 1;
      grow: while (v + h < V) {
        for (let k = 0; k < w; k++) {
          if (mask[u + k + (v + h) * U] !== key) break grow;
        }
        h++;
      }
      for (let dv = 0; dv < h; dv++) for (let du = 0; du < w; du++) mask[u + du + (v + dv) * U] = 0;
      out.push({ u, v, w, h, key });
      u += w;
    }
  }
  return out;
}
