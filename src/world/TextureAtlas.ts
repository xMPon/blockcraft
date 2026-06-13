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

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
