// Blockcraft bootstrap: wires the engine, world streaming, player physics,
// block editing, and UI together into the frame loop.
import * as THREE from "three";
import "./style.css";
import { Engine } from "./core/Engine";
import { Input } from "./core/Input";
import { Sky } from "./core/Sky";
import { createChunkMaterials } from "./core/ChunkMaterial";
import { World, RENDER_RADIUS } from "./world/World";
import { WorldGen } from "./world/WorldGen";
import { createAtlasTexture, createCrackTexture } from "./world/TextureAtlas";
import { AIR, WATER, CRAFTING_TABLE, FURNACE, isSolid } from "./world/Block";
import { CHUNK_X } from "./world/Chunk";
import { Player, EYE_HEIGHT } from "./player/Player";
import { raycastVoxel } from "./player/Raycast";
import { Inventory } from "./item/Inventory";
import { itemDef, blockDrop } from "./item/Item";
import { MiningState, toolOf, canHarvest } from "./player/Mining";
import { attackDamage, PLAYER_REACH } from "./player/Combat";
import { Hunger } from "./player/Hunger";
import { ItemDrop } from "./entity/ItemDrop";
import { Mob } from "./entity/Mob";
import { PASSIVE_MOBS, HOSTILE_MOBS, ZOMBIE, CREEPER } from "./entity/MobTypes";
import { Spawner } from "./entity/Spawner";
import { Furnaces } from "./block/Furnace";
import { Hotbar } from "./ui/Hotbar";
import { Hud } from "./ui/Hud";
import { InventoryScreen } from "./ui/InventoryScreen";
import { FurnaceUI } from "./ui/FurnaceUI";

const SEED = 1337;
const REACH = 6;
const VIEW_DISTANCE = RENDER_RADIUS * CHUNK_X;

const app = document.getElementById("app")!;
const engine = new Engine(app, VIEW_DISTANCE);
const input = new Input(engine.renderer.domElement);
const sky = new Sky();

const atlas = createAtlasTexture();
const materials = createChunkMaterials(atlas, VIEW_DISTANCE);
const world = new World(new WorldGen(SEED), engine.scene, materials);

// Sun disc that arcs across the sky; unfogged so it stays visible at the horizon.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(6, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }),
);
engine.scene.add(sun);

// Pre-generate the spawn area so the player lands on solid ground frame one
// (player physics runs before world streaming in the loop below).
for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++) world.getOrCreateChunk(cx, cz);

const player = new Player(8.5, world.gen.heightAt(8, 8) + 1, 8.5);
const hud = new Hud(document.body, () => input.requestPointerLock());

// Survival start: empty inventory — gather wood, craft a table, then tools.
const inventory = new Inventory();
const hotbar = new Hotbar(document.body, inventory);
const inventoryScreen = new InventoryScreen(document.body, inventory);
const furnaces = new Furnaces();
const furnaceUI = new FurnaceUI(document.body, inventory);
const modalOpen = () => inventoryScreen.isOpen || furnaceUI.isOpen;

// E toggles the inventory; Escape closes any open screen. Opening a screen
// releases the pointer so the mouse can drag item stacks.
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && !furnaceUI.isOpen) {
    if (inventoryScreen.isOpen) inventoryScreen.close();
    else { inventoryScreen.open(false); document.exitPointerLock(); }
  } else if (e.code === "Escape") {
    if (inventoryScreen.isOpen) inventoryScreen.close();
    if (furnaceUI.isOpen) furnaceUI.close();
  }
});

const mining = new MiningState();
const hunger = new Hunger();
const drops: ItemDrop[] = [];
const mobs: Mob[] = [];
const spawner = new Spawner();
const dropMaterial = new THREE.MeshBasicMaterial({ map: atlas, alphaTest: 0.5 });

// Mobs damage the player through this; knockback comes from the mob's position.
const mobCtx = {
  playerPos: player.position,
  damagePlayer: (amount: number, fromX: number, fromZ: number) => player.hurtFrom(amount, fromX, fromZ),
};

// The mob the player is aiming at within melee reach (cylinder along the look ray).
function pickTargetMob(): Mob | null {
  const dir = player.direction();
  const ex = player.position.x;
  const ey = player.position.y + EYE_HEIGHT;
  const ez = player.position.z;
  let best: Mob | null = null;
  let bestT = PLAYER_REACH;
  for (const mob of mobs) {
    const my = mob.position.y + mob.height * 0.5;
    const t = (mob.position.x - ex) * dir.x + (my - ey) * dir.y + (mob.position.z - ez) * dir.z;
    if (t < 0 || t > PLAYER_REACH) continue;
    const px = ex + dir.x * t;
    const py = ey + dir.y * t;
    const pz = ez + dir.z * t;
    const perp = Math.hypot(mob.position.x - px, my - py, mob.position.z - pz);
    if (perp < mob.halfW + 0.5 && t < bestT) { best = mob; bestT = t; }
  }
  return best;
}

// Wireframe box around the raycast-targeted block.
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x111111 }),
);
highlight.visible = false;
engine.scene.add(highlight);

// Crack overlay shown on the block being mined; opacity ramps with progress.
const crack = new THREE.Mesh(
  new THREE.BoxGeometry(1.01, 1.01, 1.01),
  new THREE.MeshBasicMaterial({
    map: createCrackTexture(),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  }),
);
crack.visible = false;
engine.scene.add(crack);

function spawnDrop(x: number, y: number, z: number, item: number, count: number): void {
  const drop = new ItemDrop(x + 0.5, y + 0.2, z + 0.5, item, count, dropMaterial);
  drop.velocity.set((Math.random() - 0.5) * 1.5, 2, (Math.random() - 0.5) * 1.5);
  drops.push(drop);
  engine.scene.add(drop.object3d);
}

engine.start((dt) => {
  const paused = modalOpen();
  hud.setOverlayVisible(!input.locked && !paused);

  // Advance the day/night cycle and push it into the sky + chunk shader.
  sky.update(dt);
  (engine.scene.background as THREE.Color).copy(sky.color);
  materials.uFogColor.value.copy(sky.color);
  materials.uDayFactor.value = sky.dayFactor;
  sun.position.copy(player.position).addScaledVector(sky.sunDirection, VIEW_DISTANCE * 1.1);

  furnaces.tick(dt); // furnaces keep smelting while the screen is closed
  if (!paused) player.update(dt, input, world);
  world.update(player.position.x, player.position.z);

  const dir = player.direction();
  const hit = paused
    ? null
    : raycastVoxel(
        player.position.x,
        player.position.y + EYE_HEIGHT,
        player.position.z,
        dir.x, dir.y, dir.z,
        REACH,
        (x, y, z) => isSolid(world.getBlock(x, y, z)),
      );

  highlight.visible = hit !== null;
  if (hit) highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

  // A mob in the crosshair takes priority over mining (you swing at it instead).
  const targetMob = paused ? null : pickTargetMob();

  // Hold left mouse to mine the targeted block (unless aiming at a mob). The
  // right tool tier gates the drop; correct tools break faster (see Mining).
  const tool = toolOf(inventory.selectedStack);
  const targetId = hit ? world.getBlock(hit.x, hit.y, hit.z) : AIR;
  const broke = mining.update(!paused && !targetMob && input.isMouseDown(0), hit, targetId, tool, dt);
  if (broke && hit) {
    const drop = blockDrop(targetId);
    if (drop !== null && canHarvest(targetId, tool)) spawnDrop(hit.x, hit.y, hit.z, drop, 1);
    // A broken furnace also spits out whatever was inside it.
    if (targetId === FURNACE) {
      for (const s of furnaces.remove(hit.x, hit.y, hit.z)) spawnDrop(hit.x, hit.y, hit.z, s.item, s.count);
    }
    world.setBlock(hit.x, hit.y, hit.z, AIR);
    hunger.addExhaustion(0.05);
  }

  // Crack overlay tracks the mining target.
  if (mining.target) {
    crack.visible = true;
    crack.position.set(mining.target.x + 0.5, mining.target.y + 0.5, mining.target.z + 0.5);
    (crack.material as THREE.MeshBasicMaterial).opacity = mining.progress;
  } else {
    crack.visible = false;
  }

  // Clicks: left swings at a targeted mob; right eats food, opens a table /
  // furnace, or places the held block.
  if (!paused) {
    for (const button of input.consumeClicks()) {
      if (button === 0) {
        if (targetMob && targetMob.hurt(attackDamage(inventory.selectedStack), player.position.x, player.position.z)) {
          hunger.addExhaustion(0.1);
        }
        continue;
      }
      if (button !== 2) continue;
      const sel = inventory.selectedStack;
      if (sel && itemDef(sel.item).food && hunger.value < hunger.max) {
        hunger.eat(itemDef(sel.item).food!);
        inventory.consumeSelected();
        continue;
      }
      if (!hit) continue;
      const tb = world.getBlock(hit.x, hit.y, hit.z);
      if (tb === CRAFTING_TABLE) { inventoryScreen.open(true); document.exitPointerLock(); break; }
      if (tb === FURNACE) { furnaceUI.open(furnaces.getOrCreate(hit.x, hit.y, hit.z)); document.exitPointerLock(); break; }
      const place = sel ? itemDef(sel.item).placeBlock : undefined;
      if (place === undefined) continue;
      const px = hit.x + hit.face[0];
      const py = hit.y + hit.face[1];
      const pz = hit.z + hit.face[2];
      const occupant = world.getBlock(px, py, pz);
      if ((occupant === AIR || occupant === WATER) && !player.intersectsBlock(px, py, pz)) {
        world.setBlock(px, py, pz, place);
        inventory.consumeSelected();
      }
    }
  }

  // Mobs: spawn, run AI + physics, despawn the distant ones, drop loot on death.
  if (!paused) {
    spawner.update(dt, world, player.position, sky.dayFactor, mobs, (m) => {
      mobs.push(m);
      engine.scene.add(m.object3d);
    });
  }
  for (const mob of mobs) {
    if (!paused) {
      mob.aiStep(dt, world, mobCtx);
      if (mob.position.distanceTo(player.position) > 70) mob.dead = true;
    }
    mob.update(dt, world);
  }
  for (let i = mobs.length - 1; i >= 0; i--) {
    const mob = mobs[i];
    if (!mob.dead) continue;
    if (mob.health <= 0) {
      for (const l of mob.rollLoot()) {
        spawnDrop(Math.floor(mob.position.x), Math.floor(mob.position.y), Math.floor(mob.position.z), l.item, l.count);
      }
    }
    engine.scene.remove(mob.object3d);
    mobs.splice(i, 1);
  }

  // Update item drops; collect any the player reaches.
  for (const drop of drops) {
    drop.update(dt, world);
    if (drop.collectibleBy(player.position)) {
      const leftover = inventory.add(drop.item, drop.count);
      if (leftover === 0) drop.dead = true;
      else drop.count = leftover;
    }
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    if (drops[i].dead) {
      engine.scene.remove(drops[i].object3d);
      drops.splice(i, 1);
    }
  }

  // Hunger drains from activity and drives regen / starvation.
  if (!paused) {
    hunger.addExhaustion(player.frameExhaustion);
    hunger.tick(dt, player);
  }

  if (furnaceUI.isOpen) furnaceUI.refresh();
  hotbar.refresh();
  player.syncCamera(engine.camera);
  hud.update(
    player.position.x, player.position.y, player.position.z,
    player.health, player.air, player.maxAir, hunger.value, player.hurtFlash,
  );
});

// Debug handle for headless verification (drive streaming/render from devtools).
(window as unknown as { __bc: unknown }).__bc = {
  engine, world, player, input, hud, sky, materials, sun,
  inventory, mining, drops, spawnDrop, furnaces, inventoryScreen, furnaceUI,
  mobs, spawner, hunger, Mob, mobTypes: { PASSIVE_MOBS, HOSTILE_MOBS, ZOMBIE, CREEPER },
  addMob: (m: Mob) => { mobs.push(m); engine.scene.add(m.object3d); },
};
