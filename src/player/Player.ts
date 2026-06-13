// Player: first-person physics — axis-separated AABB collision against
// voxels, gravity, jumping, and yaw/pitch mouse look.
import * as THREE from "three";
import { WATER } from "../world/Block";
import { moveAndCollide, boxIntersectsCell } from "../physics/aabb";
import type { World } from "../world/World";
import type { Input } from "../core/Input";

const HALF_W = 0.3;
const HEIGHT = 1.8;
export const EYE_HEIGHT = 1.62;
const SPEED = 4.5;
const GRAVITY = 28;
const JUMP_SPEED = 8.5;
const MOUSE_SENS = 0.0022;

export const MAX_HEALTH = 20;
const MAX_AIR = 10; // seconds of breath underwater
const REGEN_INTERVAL = 3; // seconds per 1 HP passive heal (placeholder until hunger)
const SAFE_FALL = 3; // blocks of fall absorbed before damage

/** Fall damage in HP for a fall of `blocks` height. Pure — unit tested. */
export function fallDamage(blocks: number): number {
  return Math.max(0, Math.floor(blocks - SAFE_FALL));
}

export class Player {
  /** Feet position — the bottom centre of the AABB. */
  readonly position: THREE.Vector3;
  readonly velocity = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;

  health = MAX_HEALTH;
  air = MAX_AIR;
  readonly maxHealth = MAX_HEALTH;
  readonly maxAir = MAX_AIR;
  submerged = false;

  private readonly spawn: THREE.Vector3;
  private fallPeak: number;
  private drownTimer = 0;
  private regenTimer = 0;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.spawn = new THREE.Vector3(x, y, z);
    this.fallPeak = y;
  }

  update(dt: number, input: Input, world: World): void {
    const wasOnGround = this.onGround;
    if (input.locked) {
      const { dx, dy } = input.consumeMouseDelta();
      this.yaw -= dx * MOUSE_SENS;
      this.pitch -= dy * MOUSE_SENS;
      const limit = Math.PI / 2 - 0.01;
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
    }

    let fwd = 0;
    let strafe = 0;
    if (input.isDown("KeyW")) fwd += 1;
    if (input.isDown("KeyS")) fwd -= 1;
    if (input.isDown("KeyD")) strafe += 1;
    if (input.isDown("KeyA")) strafe -= 1;
    const mag = Math.hypot(fwd, strafe);
    if (mag > 0) {
      fwd /= mag;
      strafe /= mag;
    }

    // yaw 0 faces -Z (three.js camera convention).
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    this.velocity.x = (-sin * fwd + cos * strafe) * SPEED;
    this.velocity.z = (-cos * fwd - sin * strafe) * SPEED;

    this.velocity.y -= GRAVITY * dt;
    if (this.velocity.y < -50) this.velocity.y = -50;
    if (input.isDown("Space") && this.onGround) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }

    moveAndCollide(this, world, dt, HALF_W, HEIGHT);

    this.applySurvival(dt, wasOnGround, world);
  }

  // Fall damage on landing, drowning while submerged, slow passive regen, and
  // respawn on death. Hunger (Phase 4) will later gate the regen.
  private applySurvival(dt: number, wasOnGround: boolean, world: World): void {
    if (this.onGround) {
      if (!wasOnGround) this.hurt(fallDamage(this.fallPeak - this.position.y));
      this.fallPeak = this.position.y;
    } else {
      this.fallPeak = Math.max(this.fallPeak, this.position.y);
    }

    const head = world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + 1.6),
      Math.floor(this.position.z),
    );
    this.submerged = head === WATER;
    if (this.submerged) {
      this.air -= dt;
      if (this.air <= 0) {
        this.air = 0;
        this.drownTimer += dt;
        if (this.drownTimer >= 1) {
          this.hurt(2);
          this.drownTimer -= 1;
        }
      }
    } else {
      this.air = this.maxAir;
      this.drownTimer = 0;
    }

    if (this.health > 0 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= REGEN_INTERVAL) {
        this.health = Math.min(this.maxHealth, this.health + 1);
        this.regenTimer -= REGEN_INTERVAL;
      }
    } else {
      this.regenTimer = 0;
    }

    if (this.health <= 0) this.respawn();
  }

  hurt(amount: number): void {
    if (amount > 0) this.health = Math.max(0, this.health - amount);
  }

  private respawn(): void {
    this.position.copy(this.spawn);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.air = this.maxAir;
    this.drownTimer = 0;
    this.fallPeak = this.spawn.y;
  }

  /** Eye-level view direction derived from yaw/pitch. */
  direction(): THREE.Vector3 {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(
      -Math.sin(this.yaw) * cp,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cp,
    );
  }

  syncCamera(camera: THREE.PerspectiveCamera): void {
    camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = this.yaw;
    camera.rotation.x = this.pitch;
  }

  /** Would placing a block in this cell overlap the player's AABB? */
  intersectsBlock(x: number, y: number, z: number): boolean {
    return boxIntersectsCell(this.position, HALF_W, HEIGHT, x, y, z);
  }
}
