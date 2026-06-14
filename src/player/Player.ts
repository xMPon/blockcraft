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

// Swimming: in water gravity is gentle, sinking is capped, holding Space swims
// up, and horizontal movement is slowed.
const SWIM_GRAVITY = GRAVITY * 0.22;
const SWIM_SINK_CAP = 2.5; // max downward speed in water
const SWIM_UP = 4.2; // upward speed while holding Space
const SWIM_HSPEED = 0.6; // horizontal speed multiplier in water

export const MAX_HEALTH = 20;
const MAX_AIR = 10; // seconds of breath underwater
const SAFE_FALL = 3; // blocks of fall absorbed before damage
const INVULN = 0.5; // seconds of damage immunity after a hit
const SPRINT_MULT = 1.35;
const DOUBLE_TAP_MS = 280;

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
  submerged = false; // head underwater (drowning)
  inWater = false; // body in water (swimming)
  sprinting = false;
  invuln = 0; // remaining damage-immunity time
  hurtFlash = 0; // remaining red-flash time (for the HUD)
  /** Exhaustion accrued this frame for the hunger system to consume. */
  frameExhaustion = 0;

  private readonly spawn: THREE.Vector3;
  private fallPeak: number;
  private drownTimer = 0;
  private prevForward = false;
  private lastForwardTap = 0;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.spawn = new THREE.Vector3(x, y, z);
    this.fallPeak = y;
  }

  update(dt: number, input: Input, world: World): void {
    const wasOnGround = this.onGround;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.frameExhaustion = 0;
    if (input.locked) {
      const { dx, dy } = input.consumeMouseDelta();
      this.yaw -= dx * MOUSE_SENS;
      this.pitch -= dy * MOUSE_SENS;
      const limit = Math.PI / 2 - 0.01;
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
    }

    let fwd = 0;
    let strafe = 0;
    const forward = input.isDown("KeyW");
    if (forward) fwd += 1;
    if (input.isDown("KeyS")) fwd -= 1;
    if (input.isDown("KeyD")) strafe += 1;
    if (input.isDown("KeyA")) strafe -= 1;
    const mag = Math.hypot(fwd, strafe);
    if (mag > 0) {
      fwd /= mag;
      strafe /= mag;
    }

    // Double-tap W to start sprinting; it ends when W is released.
    const now = performance.now();
    if (forward && !this.prevForward) {
      if (now - this.lastForwardTap < DOUBLE_TAP_MS) this.sprinting = true;
      this.lastForwardTap = now;
    }
    this.prevForward = forward;
    if (!forward || this.health <= 0) this.sprinting = false;

    this.inWater = this.checkWater(world);

    // yaw 0 faces -Z (three.js camera convention).
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const sprintMult = this.sprinting && !this.inWater ? SPRINT_MULT : 1;
    const hspeed = SPEED * sprintMult * (this.inWater ? SWIM_HSPEED : 1);
    this.velocity.x = (-sin * fwd + cos * strafe) * hspeed;
    this.velocity.z = (-cos * fwd - sin * strafe) * hspeed;
    // Movement burns food, sprinting more so.
    if (mag > 0) this.frameExhaustion += (this.sprinting ? 0.04 : 0.01);

    if (this.inWater) {
      // Buoyant: sink gently (capped), or swim up by holding Space.
      this.velocity.y -= SWIM_GRAVITY * dt;
      if (this.velocity.y < -SWIM_SINK_CAP) this.velocity.y = -SWIM_SINK_CAP;
      if (input.isDown("Space")) this.velocity.y = SWIM_UP;
    } else {
      this.velocity.y -= GRAVITY * dt;
      if (this.velocity.y < -50) this.velocity.y = -50;
      if (input.isDown("Space") && this.onGround) {
        this.velocity.y = JUMP_SPEED;
        this.onGround = false;
      }
    }

    moveAndCollide(this, world, dt, HALF_W, HEIGHT);

    this.applySurvival(dt, wasOnGround, world);
  }

  // Fall damage on landing, drowning while submerged, and respawn on death.
  // Health regen is driven by the Hunger system, not here.
  private applySurvival(dt: number, wasOnGround: boolean, world: World): void {
    // Water cushions falls — zero the tracked drop height while swimming.
    if (this.inWater) this.fallPeak = this.position.y;

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

    if (this.health <= 0) this.respawn();
  }

  hurt(amount: number): void {
    if (amount > 0) this.health = Math.max(0, this.health - amount);
  }

  heal(amount: number): void {
    if (amount > 0) this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /** Take a hit from a world position: damage (if not in i-frames) + knockback + flash. */
  hurtFrom(amount: number, sourceX: number, sourceZ: number): void {
    if (this.invuln > 0 || amount <= 0) return;
    this.hurt(amount);
    this.invuln = INVULN;
    this.hurtFlash = 0.35;
    this.frameExhaustion += 0.5;
    let dx = this.position.x - sourceX;
    let dz = this.position.z - sourceZ;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    this.velocity.x += dx * 7;
    this.velocity.z += dz * 7;
    this.velocity.y = 5;
  }

  private respawn(): void {
    this.position.copy(this.spawn);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.air = this.maxAir;
    this.drownTimer = 0;
    this.fallPeak = this.spawn.y;
    this.sprinting = false;
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

  /** Is the player's body (feet or waist) in a water voxel? */
  private checkWater(world: World): boolean {
    const x = Math.floor(this.position.x);
    const z = Math.floor(this.position.z);
    return (
      world.getBlock(x, Math.floor(this.position.y + 0.1), z) === WATER ||
      world.getBlock(x, Math.floor(this.position.y + 0.9), z) === WATER
    );
  }
}
