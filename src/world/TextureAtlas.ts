// TextureAtlas: procedurally drawn 4×4 atlas of 16px tiles — no art assets.
// tileUV() is pure math so the mesher (and tests) can use it without a DOM.
import * as THREE from "three";
import { mulberry32 } from "../core/rng";

export const ATLAS_GRID = 4;
const TILE_PX = 16;

// Tile layout: 0 grass top, 1 grass side, 2 dirt, 3 stone, 4 sand,
// 5 wood side, 6 wood top, 7 leaves, 8 water.

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

  const speckle = (tile: number, base: string, dots: string[], count = 45) => {
    const [ox, oy] = origin(tile);
    ctx.fillStyle = base;
    ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = dots[Math.floor(rand() * dots.length)];
      ctx.fillRect(ox + Math.floor(rand() * TILE_PX), oy + Math.floor(rand() * TILE_PX), 1, 1);
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
  speckle(5, "#6e4d2c", ["#5e3f21", "#7b5836"]); // wood side
  const [wx, wy] = origin(5); // bark grooves
  ctx.fillStyle = "#54381d";
  for (const x of [2, 7, 12]) ctx.fillRect(wx + x, wy, 1, TILE_PX);
  speckle(6, "#7b5836", ["#6e4d2c"]); // wood top with growth rings
  const [tx, ty] = origin(6);
  ctx.strokeStyle = "#54381d";
  ctx.strokeRect(tx + 2.5, ty + 2.5, 11, 11);
  ctx.strokeRect(tx + 5.5, ty + 5.5, 5, 5);
  speckle(7, "#3f7d26", ["#356d1e", "#4a8c2e", "#2f6219"], 60); // leaves
  speckle(8, "#3d6fd1", ["#3565c2", "#4a7cdb"], 30); // water

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
