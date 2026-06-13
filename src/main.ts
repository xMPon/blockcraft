// Blockcraft bootstrap: wires the engine, world streaming, player physics,
// block editing, and UI together into the frame loop.
import * as THREE from "three";
import "./style.css";
import { Engine } from "./core/Engine";
import { Input } from "./core/Input";
import { World, RENDER_RADIUS } from "./world/World";
import { WorldGen } from "./world/WorldGen";
import { createAtlasTexture } from "./world/TextureAtlas";
import { AIR, WATER, isSolid } from "./world/Block";
import { CHUNK_X } from "./world/Chunk";
import { Player, EYE_HEIGHT } from "./player/Player";
import { raycastVoxel } from "./player/Raycast";
import { Hotbar } from "./ui/Hotbar";
import { Hud } from "./ui/Hud";

const SEED = 1337;
const REACH = 6;

const app = document.getElementById("app")!;
const engine = new Engine(app, RENDER_RADIUS * CHUNK_X);
const input = new Input(engine.renderer.domElement);

const atlas = createAtlasTexture();
const world = new World(new WorldGen(SEED), engine.scene, {
  solid: new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true }),
  water: new THREE.MeshBasicMaterial({
    map: atlas,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
});

// Pre-generate the spawn area so the player lands on solid ground frame one
// (player physics runs before world streaming in the loop below).
for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++) world.getOrCreateChunk(cx, cz);

const player = new Player(8.5, world.gen.heightAt(8, 8) + 1, 8.5);
const hud = new Hud(document.body, () => input.requestPointerLock());
const hotbar = new Hotbar(document.body);

// Wireframe box around the raycast-targeted block.
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x111111 }),
);
highlight.visible = false;
engine.scene.add(highlight);

engine.start((dt) => {
  hud.setOverlayVisible(!input.locked);
  player.update(dt, input, world);
  world.update(player.position.x, player.position.z);

  const dir = player.direction();
  const hit = raycastVoxel(
    player.position.x,
    player.position.y + EYE_HEIGHT,
    player.position.z,
    dir.x,
    dir.y,
    dir.z,
    REACH,
    (x, y, z) => isSolid(world.getBlock(x, y, z)),
  );

  highlight.visible = hit !== null;
  if (hit) highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

  for (const button of input.consumeClicks()) {
    if (!hit) break;
    if (button === 0) {
      world.setBlock(hit.x, hit.y, hit.z, AIR);
    } else if (button === 2) {
      const px = hit.x + hit.face[0];
      const py = hit.y + hit.face[1];
      const pz = hit.z + hit.face[2];
      const occupant = world.getBlock(px, py, pz);
      if ((occupant === AIR || occupant === WATER) && !player.intersectsBlock(px, py, pz)) {
        world.setBlock(px, py, pz, hotbar.selectedBlockId);
      }
    }
  }

  player.syncCamera(engine.camera);
  hud.update(player.position.x, player.position.y, player.position.z);
});

// Debug handle for headless verification (drive streaming/render from devtools).
(window as unknown as { __bc: unknown }).__bc = { engine, world, player, input, hud };
