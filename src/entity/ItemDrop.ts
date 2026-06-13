// ItemDrop: a small spinning, bobbing cube that holds an item stack on the
// ground. Collected when the player gets close (after a short pickup delay so a
// just-dropped item doesn't snap straight back).
import * as THREE from "three";
import { Entity } from "./Entity";
import { itemDef } from "../item/Item";
import { tileUV } from "../world/TextureAtlas";
import type { BlockReader } from "../physics/aabb";

const SIZE = 0.28;
const PICKUP_DELAY = 0.5; // seconds before collectible
const PICKUP_RANGE = 1.4;

// A cube whose six faces all show one atlas tile.
function itemGeometry(tile: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  const uv = geo.getAttribute("uv");
  const [u0, v0, u1, v1] = tileUV(tile);
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
  uv.needsUpdate = true;
  return geo;
}

export class ItemDrop extends Entity {
  readonly object3d: THREE.Mesh;
  readonly item: number;
  count: number;
  private age = 0;

  constructor(x: number, y: number, z: number, item: number, count: number, material: THREE.Material) {
    super(x, y, z, SIZE / 2, SIZE);
    this.item = item;
    this.count = count;
    this.object3d = new THREE.Mesh(itemGeometry(itemDef(item).icon), material);
  }

  update(dt: number, world: BlockReader): void {
    this.age += dt;
    this.physics(dt, world);
    // Hover the visual just above the feet position and spin it.
    this.object3d.position.set(
      this.position.x,
      this.position.y + 0.15 + Math.sin(this.age * 3) * 0.05,
      this.position.z,
    );
    this.object3d.rotation.y += dt * 1.5;
  }

  collectibleBy(pos: THREE.Vector3): boolean {
    return this.age >= PICKUP_DELAY && pos.distanceTo(this.position) <= PICKUP_RANGE;
  }
}
