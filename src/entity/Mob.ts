// Mob: a living creature with a boxy model, simple AI (wander / flee / seek /
// attack), health with knockback + i-frames, and loot. Data-driven by MobType
// so all seven creatures share one class. Creepers explode; the rest melee.
import * as THREE from "three";
import { Entity } from "./Entity";
import { isSolid, BEDROCK, WATER } from "../world/Block";
import type { BlockReader } from "../physics/aabb";

const MOB_JUMP = 8;
const BLAST_RADIUS = 3;

// World view a mob needs: read blocks (physics + AI) and edit them (creeper blast).
export interface MobWorld extends BlockReader {
  setBlock(wx: number, wy: number, wz: number, id: number): void;
}

export interface MobCtx {
  playerPos: THREE.Vector3;
  /** Deal damage to the player from a world position (for knockback direction). */
  damagePlayer: (amount: number, fromX: number, fromZ: number) => void;
  /** Spawn an arrow from a world position with a launch velocity (skeletons). */
  shootArrow: (x: number, y: number, z: number, vx: number, vy: number, vz: number) => void;
}

interface MobPart {
  w: number; h: number; d: number;
  x: number; y: number; z: number;
  color: number;
  leg?: boolean;
}

interface LootEntry { item: number; min: number; max: number; chance?: number }

export interface MobType {
  name: string;
  hostile: boolean;
  health: number;
  speed: number;
  halfW: number;
  height: number;
  parts: MobPart[];
  detect?: number; // hostile aggro range
  attack?: number; // melee touch damage
  special?: "creeper" | "skeleton";
  loot: LootEntry[];
}

// All integer offsets within a Euclidean sphere of the given radius (pure; tested).
export function blastOffsets(radius: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const r = Math.ceil(radius);
  for (let x = -r; x <= r; x++) {
    for (let y = -r; y <= r; y++) {
      for (let z = -r; z <= r; z++) {
        if (x * x + y * y + z * z <= radius * radius) out.push([x, y, z]);
      }
    }
  }
  return out;
}

function buildModel(type: MobType): { group: THREE.Group; legs: THREE.Mesh[] } {
  const group = new THREE.Group();
  const legs: THREE.Mesh[] = [];
  for (const p of type.parts) {
    // Lambert so the scene's hemisphere + sun light shade the mob (the chunk
    // shader ignores scene lights, so this only affects entities).
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(p.w, p.h, p.d),
      new THREE.MeshLambertMaterial({ color: p.color }),
    );
    mesh.position.set(p.x, p.y, p.z);
    group.add(mesh);
    if (p.leg) legs.push(mesh);
  }
  return { group, legs };
}

export class Mob extends Entity {
  readonly object3d: THREE.Group;
  health: number;
  private readonly legs: THREE.Mesh[];
  private hurtCd = 0;
  private attackCd = 0;
  private fleeTimer = 0;
  private wanderTimer = 0;
  private wanderHeading = 0;
  private wanderActive = false;
  private fuse = 0;
  private legPhase = 0;

  constructor(readonly type: MobType, x: number, y: number, z: number) {
    super(x, y, z, type.halfW, type.height);
    this.health = type.health;
    const m = buildModel(type);
    this.object3d = m.group;
    this.legs = m.legs;
  }

  /** AI: choose a move direction, attack, or (creeper) fuse + explode. */
  aiStep(dt: number, world: MobWorld, ctx: MobCtx): void {
    this.hurtCd = Math.max(0, this.hurtCd - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    if (this.fleeTimer > 0) this.fleeTimer -= dt;

    const dx = ctx.playerPos.x - this.position.x;
    const dz = ctx.playerPos.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    const detect = this.type.detect ?? 16;
    let mx = 0;
    let mz = 0;

    if (this.type.hostile && dist < detect && dist > 0.001) {
      const nx = dx / dist;
      const nz = dz / dist;
      if (this.type.special === "skeleton") {
        // Kite: back off when too close, approach from afar, else hold and fire.
        if (dist < 5) { mx = -nx; mz = -nz; }
        else if (dist > 9) { mx = nx; mz = nz; }
        this.object3d.rotation.y = Math.atan2(nx, nz);
        if (this.attackCd <= 0 && dist < 13) {
          // Aim at the player's chest with an upward arc to fight gravity.
          const SPEED = 26;
          const tx = ctx.playerPos.x - this.position.x;
          const ty = ctx.playerPos.y + 1.0 - (this.position.y + this.height * 0.75);
          const tz = ctx.playerPos.z - this.position.z;
          const len = Math.hypot(tx, ty, tz) || 1;
          const ax = tx / len;
          const ay = ty / len + dist * 0.022; // arc compensation
          const az = tz / len;
          const al = Math.hypot(ax, ay, az) || 1;
          ctx.shootArrow(
            this.position.x + ax * 0.5, this.position.y + this.height * 0.75, this.position.z + az * 0.5,
            (ax / al) * SPEED, (ay / al) * SPEED, (az / al) * SPEED,
          );
          this.attackCd = 1.8;
        }
      } else if (this.type.special === "creeper") {
        if (dist < 2.8) {
          this.fuse += dt;
          this.object3d.scale.setScalar(Math.min(1.6, 1 + this.fuse * 0.25 + Math.sin(this.fuse * 22) * 0.08));
          if (this.fuse >= 1.5) {
            this.explode(world, ctx);
            this.dead = true;
            return;
          }
        } else {
          this.fuse = Math.max(0, this.fuse - dt * 2);
          this.object3d.scale.setScalar(1);
          mx = nx;
          mz = nz;
        }
      } else {
        mx = nx;
        mz = nz;
        if (dist < 1.6 && this.attackCd <= 0) {
          ctx.damagePlayer(this.type.attack ?? 3, this.position.x, this.position.z);
          this.attackCd = 1;
        }
      }
    } else if (this.fleeTimer > 0 && dist > 0.001) {
      mx = -dx / dist;
      mz = -dz / dist;
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderActive = Math.random() < 0.6;
        this.wanderHeading = Math.random() * Math.PI * 2;
        this.wanderTimer = 2 + Math.random() * 3;
      }
      if (this.wanderActive) {
        mx = Math.sin(this.wanderHeading);
        mz = Math.cos(this.wanderHeading);
      }
    }

    const moving = mx !== 0 || mz !== 0;
    this.velocity.x = mx * this.type.speed;
    this.velocity.z = mz * this.type.speed;
    if (this.onGround && moving && this.blockedAhead(world, mx, mz)) this.velocity.y = MOB_JUMP;
    if (moving) this.object3d.rotation.y = Math.atan2(mx, mz);
  }

  update(dt: number, world: BlockReader): void {
    this.physics(dt, world);
    this.object3d.position.set(this.position.x, this.position.y, this.position.z);
    const hspeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (hspeed > 0.1) this.legPhase += dt * 9;
    const swing = hspeed > 0.1 ? Math.sin(this.legPhase) * 0.5 : 0;
    for (let i = 0; i < this.legs.length; i++) this.legs[i].rotation.x = swing * (i % 2 === 0 ? 1 : -1);
  }

  /** Take a hit; returns false if still in i-frames. Applies knockback. */
  hurt(amount: number, fromX: number, fromZ: number): boolean {
    if (this.hurtCd > 0) return false;
    this.health -= amount;
    this.hurtCd = 0.3;
    this.fleeTimer = 6;
    let kx = this.position.x - fromX;
    let kz = this.position.z - fromZ;
    const len = Math.hypot(kx, kz) || 1;
    this.velocity.x += (kx / len) * 6;
    this.velocity.z += (kz / len) * 6;
    this.velocity.y = 4;
    if (this.health <= 0) this.dead = true;
    return true;
  }

  rollLoot(): { item: number; count: number }[] {
    const out: { item: number; count: number }[] = [];
    for (const l of this.type.loot) {
      if (l.chance !== undefined && Math.random() > l.chance) continue;
      const count = l.min + Math.floor(Math.random() * (l.max - l.min + 1));
      if (count > 0) out.push({ item: l.item, count });
    }
    return out;
  }

  private explode(world: MobWorld, ctx: MobCtx): void {
    const cx = Math.floor(this.position.x);
    const cy = Math.floor(this.position.y);
    const cz = Math.floor(this.position.z);
    for (const [ox, oy, oz] of blastOffsets(BLAST_RADIUS)) {
      const b = world.getBlock(cx + ox, cy + oy, cz + oz);
      if (b !== 0 && b !== BEDROCK && b !== WATER) world.setBlock(cx + ox, cy + oy, cz + oz, 0);
    }
    const d = ctx.playerPos.distanceTo(this.position);
    if (d < BLAST_RADIUS + 2) {
      ctx.damagePlayer(Math.round((1 - d / (BLAST_RADIUS + 2)) * 18), this.position.x, this.position.z);
    }
  }

  // Is there a 1-block step directly ahead that the mob should hop over?
  private blockedAhead(world: BlockReader, mx: number, mz: number): boolean {
    const fx = Math.floor(this.position.x + Math.sign(mx) * (this.halfW + 0.2));
    const fz = Math.floor(this.position.z + Math.sign(mz) * (this.halfW + 0.2));
    const fy = Math.floor(this.position.y);
    return isSolid(world.getBlock(fx, fy, fz)) && !isSolid(world.getBlock(fx, fy + 1, fz));
  }
}
