// Arrow: a lightweight projectile fired by skeletons. Flies with a little
// gravity, sticks (dies) on hitting a solid block, and expires after a few
// seconds. The main loop checks arrow-vs-player hits.
import * as THREE from "three";
import { isSolid } from "../world/Block";
import type { BlockReader } from "../physics/aabb";

const ARROW_GRAVITY = 10;
const LIFETIME = 5;

export class Arrow {
  readonly object3d: THREE.Mesh;
  readonly position: THREE.Vector3;
  readonly velocity: THREE.Vector3;
  dead = false;
  private life = 0;

  constructor(x: number, y: number, z: number, vx: number, vy: number, vz: number, material: THREE.Material) {
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(vx, vy, vz);
    // Thin shaft elongated on +Z; lookAt points it along its flight path.
    this.object3d = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.6), material);
    this.object3d.position.copy(this.position);
  }

  update(dt: number, world: BlockReader): void {
    this.life += dt;
    this.velocity.y -= ARROW_GRAVITY * dt;
    this.position.addScaledVector(this.velocity, dt);
    if (isSolid(world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z)))) {
      this.dead = true;
    }
    if (this.life > LIFETIME || this.position.y < 0) this.dead = true;
    this.object3d.position.copy(this.position);
    this.object3d.lookAt(this.position.x + this.velocity.x, this.position.y + this.velocity.y, this.position.z + this.velocity.z);
  }
}
