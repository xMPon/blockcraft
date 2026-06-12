// Raycast: Amanatides–Woo voxel DDA. Pure module (no three.js, no DOM) so it
// runs under vitest in node. The cell containing the ray origin is skipped.
export interface RayHit {
  /** The targeted voxel. */
  x: number;
  y: number;
  z: number;
  /** Outward normal of the face the ray entered through. */
  face: [number, number, number];
}

export function raycastVoxel(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
  isTargetAt: (x: number, y: number, z: number) => boolean,
): RayHit | null {
  const len = Math.hypot(dx, dy, dz);
  if (len === 0) return null;
  dx /= len;
  dy /= len;
  dz /= len;

  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);

  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;

  // t at which the ray crosses the next voxel boundary on each axis.
  let tMaxX = dx !== 0 ? (dx > 0 ? x + 1 - ox : ox - x) / Math.abs(dx) : Infinity;
  let tMaxY = dy !== 0 ? (dy > 0 ? y + 1 - oy : oy - y) / Math.abs(dy) : Infinity;
  let tMaxZ = dz !== 0 ? (dz > 0 ? z + 1 - oz : oz - z) / Math.abs(dz) : Infinity;
  const tDeltaX = dx !== 0 ? 1 / Math.abs(dx) : Infinity;
  const tDeltaY = dy !== 0 ? 1 / Math.abs(dy) : Infinity;
  const tDeltaZ = dz !== 0 ? 1 / Math.abs(dz) : Infinity;

  let t = 0;
  while (t <= maxDist) {
    let face: [number, number, number];
    if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
      x += stepX;
      t = tMaxX;
      tMaxX += tDeltaX;
      face = [-stepX, 0, 0];
    } else if (tMaxY <= tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      face = [0, -stepY, 0];
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      face = [0, 0, -stepZ];
    }
    if (t > maxDist) return null;
    if (isTargetAt(x, y, z)) return { x, y, z, face };
  }
  return null;
}
