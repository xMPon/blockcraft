// Shared swept-AABB-vs-voxels resolver. Used by the player and every entity
// (item drops, mobs). Axis-separated so sliding along walls works naturally.
import * as THREE from "three";
import { isSolid } from "../world/Block";

const EPS = 0.001;

/** The minimal mutable body the resolver moves. */
export interface AABBBody {
  position: THREE.Vector3; // feet = bottom centre of the box
  velocity: THREE.Vector3;
  onGround: boolean;
}

/** What the resolver needs from the world. */
export interface BlockReader {
  getBlock(wx: number, wy: number, wz: number): number;
}

/** Integrate velocity over dt, resolving collisions for a halfW×height×halfW box. */
export function moveAndCollide(
  body: AABBBody, world: BlockReader, dt: number, halfW: number, height: number,
): void {
  body.onGround = false;
  collideAxis(body, world, 0, body.velocity.x * dt, halfW, height);
  collideAxis(body, world, 2, body.velocity.z * dt, halfW, height);
  collideAxis(body, world, 1, body.velocity.y * dt, halfW, height);
}

function collideAxis(
  body: AABBBody, world: BlockReader, axis: 0 | 1 | 2, amount: number,
  halfW: number, height: number,
): void {
  if (amount === 0) return;
  const p = body.position;
  if (axis === 0) p.x += amount;
  else if (axis === 1) p.y += amount;
  else p.z += amount;

  const minX = Math.floor(p.x - halfW);
  const maxX = Math.floor(p.x + halfW);
  const minY = Math.floor(p.y);
  const maxY = Math.floor(p.y + height);
  const minZ = Math.floor(p.z - halfW);
  const maxZ = Math.floor(p.z + halfW);

  // Nearest blocking face across all overlapped voxels on the moved axis.
  let clamp: number | null = null;
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (!isSolid(world.getBlock(x, y, z))) continue;
        const cell = axis === 0 ? x : axis === 1 ? y : z;
        if (amount > 0) clamp = clamp === null ? cell : Math.min(clamp, cell);
        else clamp = clamp === null ? cell + 1 : Math.max(clamp, cell + 1);
      }
    }
  }
  if (clamp === null) return;

  if (axis === 0) {
    p.x = amount > 0 ? clamp - halfW - EPS : clamp + halfW + EPS;
    body.velocity.x = 0;
  } else if (axis === 1) {
    if (amount > 0) {
      p.y = clamp - height - EPS;
    } else {
      p.y = clamp;
      body.onGround = true;
    }
    body.velocity.y = 0;
  } else {
    p.z = amount > 0 ? clamp - halfW - EPS : clamp + halfW + EPS;
    body.velocity.z = 0;
  }
}

/** AABB overlap test against the unit cube at (x,y,z) — used for placement checks. */
export function boxIntersectsCell(
  pos: THREE.Vector3, halfW: number, height: number, x: number, y: number, z: number,
): boolean {
  return (
    x + 1 > pos.x - halfW && x < pos.x + halfW &&
    y + 1 > pos.y && y < pos.y + height &&
    z + 1 > pos.z - halfW && z < pos.z + halfW
  );
}
