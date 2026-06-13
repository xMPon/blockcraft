// Entity: base for everything that moves through the world with AABB physics
// (item drops now; mobs in Phase 4). Holds a body the shared resolver moves and
// an Object3D the scene renders.
import * as THREE from "three";
import { moveAndCollide, type BlockReader } from "../physics/aabb";

const GRAVITY = 28;
const TERMINAL = 50;

export abstract class Entity {
  readonly position: THREE.Vector3;
  readonly velocity = new THREE.Vector3();
  onGround = false;
  dead = false;

  constructor(
    x: number, y: number, z: number,
    readonly halfW: number,
    readonly height: number,
  ) {
    this.position = new THREE.Vector3(x, y, z);
  }

  /** The renderable for this entity (added to / removed from the scene). */
  abstract readonly object3d: THREE.Object3D;

  /** Per-frame update; concrete entities call physics() as needed. */
  abstract update(dt: number, world: BlockReader): void;

  /** Apply gravity and resolve voxel collisions. */
  protected physics(dt: number, world: BlockReader): void {
    this.velocity.y = Math.max(-TERMINAL, this.velocity.y - GRAVITY * dt);
    moveAndCollide(this, world, dt, this.halfW, this.height);
  }
}
