// TextureAtlas: procedurally drawn 8×8 atlas of 16px tiles — no art assets.
// tileUV() is pure math so the mesher (and tests) can use it without a DOM.
import * as THREE from "three";
import { mulberry32 } from "../core/rng";

export const ATLAS_GRID = 8;
const TILE_PX = 16;

// Tile layout (index → meaning):
// 0 grass top, 1 grass side, 2 dirt, 3 stone, 4 sand, 5 log side, 6 log top,
// 7 leaves, 8 water, 9 bedrock, 10 cobblestone, 11 planks, 12 gravel, 13 lava,
// 14 coal ore, 15 iron ore, 16 gold ore, 17 diamond ore, 18 redstone ore, 19 torch.

/** UV window for a tile: [u0, v0, u1, v1] with v0 at the tile's bottom edge. */
export function tileUV(tile: number): [number, number, number, number] {
  const col = tile % ATLAS_GRID;
  const row = Math.floor(tile / ATLAS_GRID);
  const s = 1 / ATLAS_GRID;
  return [col * s, 1 - (row + 1) * s, (col + 1) * s, 1 - row * s];
}

export function createAtlasTexture(): THREE.CanvasTexture {
  const size = ATLAS_GRID * TILE_PX;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(42);

  const origin = (tile: number): [number, number] => [
    (tile % ATLAS_GRID) * TILE_PX,
    Math.floor(tile / ATLAS_GRID) * TILE_PX,
  ];

  // Solid base fill plus random single-pixel speckle for a hand-drawn voxel look.
  const speckle = (tile: number, base: string, dots: string[], count = 45) => {
    const [ox, oy] = origin(tile);
    ctx.fillStyle = base;
    ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = dots[Math.floor(rand() * dots.length)];
      ctx.fillRect(ox + Math.floor(rand() * TILE_PX), oy + Math.floor(rand() * TILE_PX), 1, 1);
    }
  };

  // Scatter coloured ore blobs over a stone base.
  const ore = (tile: number, blob: string, dark: string) => {
    speckle(tile, "#8d8d8d", ["#7f7f7f", "#999999", "#747474"]);
    const [ox, oy] = origin(tile);
    for (let i = 0; i < 7; i++) {
      const bx = ox + 2 + Math.floor(rand() * 11);
      const by = oy + 2 + Math.floor(rand() * 11);
      ctx.fillStyle = blob;
      ctx.fillRect(bx, by, 2, 2);
      ctx.fillStyle = dark;
      ctx.fillRect(bx, by, 1, 1);
    }
  };

  speckle(0, "#69a83f", ["#5d9e3a", "#76b54a", "#558f33"]); // grass top
  speckle(1, "#7d5a3c", ["#6f4f33", "#8a6543", "#654729"]); // grass side base
  const [gx, gy] = origin(1); // green turf strip along the tile's top edge
  ctx.fillStyle = "#69a83f";
  ctx.fillRect(gx, gy, TILE_PX, 3);
  speckle(2, "#7d5a3c", ["#6f4f33", "#8a6543", "#654729"]); // dirt
  speckle(3, "#8d8d8d", ["#7f7f7f", "#999999", "#747474"]); // stone
  speckle(4, "#d9ce8f", ["#cfc382", "#e4da9e", "#c4b876"]); // sand
  speckle(5, "#6e4d2c", ["#5e3f21", "#7b5836"]); // log side
  const [lx, ly] = origin(5); // bark grooves
  ctx.fillStyle = "#54381d";
  for (const x of [2, 7, 12]) ctx.fillRect(lx + x, ly, 1, TILE_PX);
  speckle(6, "#7b5836", ["#6e4d2c"]); // log top with growth rings
  const [tx, ty] = origin(6);
  ctx.strokeStyle = "#54381d";
  ctx.strokeRect(tx + 2.5, ty + 2.5, 11, 11);
  ctx.strokeRect(tx + 5.5, ty + 5.5, 5, 5);
  speckle(7, "#3f7d26", ["#356d1e", "#4a8c2e", "#2f6219"], 60); // leaves
  speckle(8, "#3d6fd1", ["#3565c2", "#4a7cdb"], 30); // water

  speckle(9, "#4a4a4a", ["#3a3a3a", "#565656", "#2f2f2f"], 55); // bedrock
  // cobblestone — chunky cobbles with dark mortar lines
  speckle(10, "#8a8a8a", ["#9a9a9a", "#777777"]);
  const [cx, cy] = origin(10);
  ctx.strokeStyle = "#5c5c5c";
  ctx.strokeRect(cx + 0.5, cy + 0.5, 7, 7);
  ctx.strokeRect(cx + 8.5, cy + 0.5, 6, 6);
  ctx.strokeRect(cx + 1.5, cy + 8.5, 6, 6);
  ctx.strokeRect(cx + 8.5, cy + 7.5, 6, 7);
  // planks — horizontal boards
  speckle(11, "#b9925a", ["#a8824c", "#c49f66"]);
  const [px, py] = origin(11);
  ctx.fillStyle = "#8a6a3c";
  for (const y of [3, 7, 11, 15]) ctx.fillRect(px, py + y, TILE_PX, 1);
  ctx.fillRect(px + 5, py, 1, 4);
  ctx.fillRect(px + 11, py + 8, 1, 4);
  speckle(12, "#8a8076", ["#6f675e", "#9a9088", "#b0a698"], 70); // gravel
  speckle(13, "#e2622a", ["#f29a3a", "#c23a18", "#ffcf57"], 65); // lava

  ore(14, "#2a2a2a", "#111111"); // coal
  ore(15, "#caa17e", "#a07a52"); // iron
  ore(16, "#f2d65a", "#c9a93a"); // gold
  ore(17, "#52d9d0", "#2fa8a0"); // diamond
  ore(18, "#d23a2a", "#8a1f15"); // redstone

  // torch — transparent tile with a centered stick + glowing flame
  {
    const [ox, oy] = origin(19);
    ctx.clearRect(ox, oy, TILE_PX, TILE_PX);
    ctx.fillStyle = "#6e4d2c"; // stick
    ctx.fillRect(ox + 7, oy + 6, 2, 9);
    ctx.fillStyle = "#ffcf57"; // flame core
    ctx.fillRect(ox + 6, oy + 3, 4, 4);
    ctx.fillStyle = "#ff8c2a"; // flame edge
    ctx.fillRect(ox + 7, oy + 2, 2, 1);
    ctx.fillRect(ox + 6, oy + 6, 4, 1);
  }

  // --- Item icons (transparent background) -------------------------------
  const tile = (i: number) => {
    const [ox, oy] = origin(i);
    ctx.clearRect(ox, oy, TILE_PX, TILE_PX);
    return [ox, oy] as const;
  };
  const rect = (ox: number, oy: number, x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, w, h);
  };
  const blob = (i: number, base: string, dark: string) => {
    const [ox, oy] = tile(i);
    rect(ox, oy, 4, 5, 8, 6, base);
    rect(ox, oy, 5, 4, 6, 8, base);
    rect(ox, oy, 5, 6, 2, 2, dark);
  };

  // 20 stick
  { const [ox, oy] = tile(20); rect(ox, oy, 9, 3, 2, 4, "#8a6a3c"); rect(ox, oy, 7, 6, 2, 4, "#7b5836"); rect(ox, oy, 5, 9, 2, 4, "#6e4d2c"); }
  blob(21, "#2f2f2f", "#101010"); // coal
  { const [ox, oy] = tile(22); rect(ox, oy, 3, 6, 10, 4, "#e8d8c4"); rect(ox, oy, 3, 6, 10, 1, "#fff6ea"); } // iron ingot
  { const [ox, oy] = tile(23); rect(ox, oy, 3, 6, 10, 4, "#f2d65a"); rect(ox, oy, 3, 6, 10, 1, "#fff2a8"); } // gold ingot
  { const [ox, oy] = tile(24); rect(ox, oy, 6, 3, 4, 2, "#7af0e8"); rect(ox, oy, 4, 5, 8, 4, "#52d9d0"); rect(ox, oy, 6, 9, 4, 2, "#2fa8a0"); } // diamond
  blob(25, "#caa17e", "#9a754d"); // raw iron
  blob(26, "#e6c558", "#b59a32"); // raw gold
  { const [ox, oy] = tile(27); for (const [x, y] of [[5, 4], [8, 5], [6, 8], [9, 9], [4, 10], [10, 7]]) rect(ox, oy, x, y, 2, 2, "#d23a2a"); } // redstone
  // 28 pickaxe, 29 axe, 30 shovel, 31 sword — simple head + handle
  { const [ox, oy] = tile(28); rect(ox, oy, 3, 3, 10, 2, "#c9c9c9"); rect(ox, oy, 7, 4, 2, 9, "#7b5836"); }
  { const [ox, oy] = tile(29); rect(ox, oy, 8, 3, 4, 4, "#c9c9c9"); rect(ox, oy, 7, 4, 2, 9, "#7b5836"); }
  { const [ox, oy] = tile(30); rect(ox, oy, 6, 3, 4, 4, "#c9c9c9"); rect(ox, oy, 7, 6, 2, 7, "#7b5836"); }
  { const [ox, oy] = tile(31); rect(ox, oy, 7, 2, 2, 8, "#d8d8d8"); rect(ox, oy, 5, 9, 6, 2, "#9a7b4c"); rect(ox, oy, 7, 11, 2, 3, "#7b5836"); }

  // --- Block faces for crafting table / furnace / glass ------------------
  // 32 crafting table top — planks with a crafting grid
  speckle(32, "#b9925a", ["#a8824c", "#c49f66"]);
  { const [ox, oy] = origin(32); ctx.strokeStyle = "#5e3f21"; ctx.strokeRect(ox + 2.5, oy + 2.5, 11, 11); ctx.beginPath(); ctx.moveTo(ox + 8, oy + 3); ctx.lineTo(ox + 8, oy + 13); ctx.moveTo(ox + 3, oy + 8); ctx.lineTo(ox + 13, oy + 8); ctx.stroke(); }
  // 33 crafting table side — planks with tool silhouettes
  speckle(33, "#9a6f3a", ["#8a6030", "#a87c44"]);
  { const [ox, oy] = origin(33); rect(ox, oy, 3, 3, 4, 2, "#6e4d2c"); rect(ox, oy, 9, 9, 4, 3, "#6e4d2c"); }
  // 34 furnace front — stone with a dark mouth
  speckle(34, "#6b6b6b", ["#5c5c5c", "#787878"]);
  { const [ox, oy] = origin(34); rect(ox, oy, 4, 5, 8, 7, "#2a2a2a"); rect(ox, oy, 6, 9, 4, 2, "#7a5a2a"); rect(ox, oy, 4, 2, 8, 2, "#565656"); }
  // 35 furnace top/side — plain dressed stone
  speckle(35, "#6f6f6f", ["#606060", "#7d7d7d"]);
  { const [ox, oy] = origin(35); ctx.strokeStyle = "#525252"; ctx.strokeRect(ox + 1.5, oy + 1.5, 13, 13); }
  // 36 glass — opaque frame, transparent centre (shader discards a<0.5)
  { const [ox, oy] = tile(36); ctx.strokeStyle = "#dff1ff"; ctx.strokeRect(ox + 0.5, oy + 0.5, 15, 15); rect(ox, oy, 2, 2, 4, 1, "#ffffff"); rect(ox, oy, 11, 9, 3, 1, "#cfe9ff"); }

  // --- Foods (37–44) and mob materials (45–49) --------------------------
  const meat = (i: number, base: string, bone: string) => {
    blob(i, base, base);
    const [ox, oy] = origin(i);
    rect(ox, oy, 10, 3, 3, 2, bone); // little bone nub
  };
  meat(37, "#e98f9c", "#f3d9c2"); // raw pork
  meat(38, "#b5663a", "#f3d9c2"); // cooked pork
  meat(39, "#c8484f", "#f3d9c2"); // raw beef
  meat(40, "#7a4a2c", "#f3d9c2"); // steak
  meat(41, "#d76b74", "#f3d9c2"); // raw mutton
  meat(42, "#9a5a38", "#f3d9c2"); // cooked mutton
  meat(43, "#e8c2a0", "#f3d9c2"); // raw chicken
  meat(44, "#c08a4a", "#f3d9c2"); // cooked chicken
  { const [ox, oy] = tile(45); rect(ox, oy, 7, 2, 2, 11, "#cfcfcf"); rect(ox, oy, 5, 4, 6, 1, "#ffffff"); rect(ox, oy, 4, 7, 8, 1, "#ffffff"); } // feather
  blob(46, "#8a5a32", "#6e451f"); // leather
  blob(47, "#e6e2da", "#cfcabf"); // wool
  { const [ox, oy] = tile(48); rect(ox, oy, 3, 3, 1, 10, "#dcdcdc"); rect(ox, oy, 6, 5, 1, 8, "#cfcfcf"); rect(ox, oy, 9, 2, 1, 11, "#e8e8e8"); } // string
  blob(49, "#5a5a5a", "#3a3a3a"); // gunpowder
  // 52 bone — a shaft with knobbed ends
  { const [ox, oy] = tile(52); rect(ox, oy, 6, 4, 4, 8, "#e8e4d0"); rect(ox, oy, 4, 3, 3, 3, "#f4f0e0"); rect(ox, oy, 9, 3, 3, 3, "#f4f0e0"); rect(ox, oy, 4, 10, 3, 3, "#f4f0e0"); rect(ox, oy, 9, 10, 3, 3, "#f4f0e0"); }

  // --- Chest block faces (50 top, 51 side+latch) -------------------------
  speckle(50, "#7a5326", ["#8a5f2e", "#6b481f"]);
  { const [ox, oy] = origin(50); ctx.strokeStyle = "#4f3416"; ctx.strokeRect(ox + 1.5, oy + 1.5, 13, 13); }
  speckle(51, "#7a5326", ["#8a5f2e", "#6b481f"]);
  { const [ox, oy] = origin(51);
    ctx.strokeStyle = "#4f3416"; ctx.strokeRect(ox + 0.5, oy + 0.5, 15, 15);
    rect(ox, oy, 0, 6, 16, 2, "#4f3416"); // band
    rect(ox, oy, 6, 6, 4, 4, "#d9c27a"); rect(ox, oy, 7, 7, 2, 2, "#5a4a1e"); } // latch

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A single dark-crack overlay shown on the block being mined, its opacity
// ramped with break progress (a cheap stand-in for staged crack textures).
export function createCrackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_PX;
  canvas.height = TILE_PX;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = 1;
  const crack = (pts: [number, number][]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  };
  crack([[8, 0], [7, 5], [9, 9], [8, 16]]);
  crack([[0, 7], [5, 8], [9, 6], [16, 9]]);
  crack([[2, 2], [5, 6]]);
  crack([[14, 13], [11, 9]]);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}
