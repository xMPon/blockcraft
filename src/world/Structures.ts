// Structures: deterministic village stamping. The world is tiled into regions;
// ~a third hold a town whose houses sit on a plot grid around a hashed centre.
// Each chunk stamps only the parts of nearby towns that fall inside it, so towns
// span chunk borders seamlessly regardless of generation order. Pure of DOM.
import { Chunk, CHUNK_Y } from "./Chunk";
import { hash01 } from "../core/rng";
import { AIR, PLANKS, WOOD, COBBLESTONE, GLASS, CHEST, CRAFTING_TABLE, FURNACE, TORCH } from "./Block";
import type { WorldGen } from "./WorldGen";

const SEA_LEVEL = 63; // kept in sync with WorldGen (avoids a value-import cycle)
const REGION = 64; // world tile that may contain one town
const MARGIN = 14; // keep the centre away from region edges
const TOWN_CHANCE = 0.4; // fraction of regions with a town
const PLOT = 11; // spacing between building plots
const HALF = 3; // house half-footprint → 7×7
const WALL_H = 3;
const TOWN_RADIUS = PLOT + HALF + 2; // max reach of a town from its centre

interface Building { kind: "house" | "lamp"; bx: number; bz: number; variant: number }

function townCenter(rx: number, rz: number, seed: number): { cx: number; cz: number } | null {
  if (hash01(rx, rz, seed ^ 0x70_77_00) > TOWN_CHANCE) return null;
  const cx = rx * REGION + MARGIN + Math.floor(hash01(rx * 7, rz, seed ^ 0x11) * (REGION - 2 * MARGIN));
  const cz = rz * REGION + MARGIN + Math.floor(hash01(rx, rz * 7, seed ^ 0x22) * (REGION - 2 * MARGIN));
  return { cx, cz };
}

function buildingsOf(rx: number, rz: number, gen: WorldGen): Building[] {
  const center = townCenter(rx, rz, gen.seed);
  if (!center) return [];
  const out: Building[] = [];
  for (let gx = -1; gx <= 1; gx++) {
    for (let gz = -1; gz <= 1; gz++) {
      const bx = center.cx + gx * PLOT;
      const bz = center.cz + gz * PLOT;
      // Don't build on water, beaches, or steep mountains.
      if (gen.heightAt(bx, bz) <= SEA_LEVEL + 1) continue;
      if (gen.biomeAt(bx, bz) === "mountains") continue;
      const r = hash01(bx * 13, bz * 13, gen.seed ^ 0x9a);
      if (gx === 0 && gz === 0) out.push({ kind: "house", bx, bz, variant: Math.floor(r * 4) });
      else if (r < 0.72) out.push({ kind: "house", bx, bz, variant: Math.floor(r * 100) % 4 });
      else if (r < 0.85) out.push({ kind: "lamp", bx, bz, variant: 0 });
    }
  }
  return out;
}

/** Stamp any village blocks that fall inside this chunk. Call after terrain/trees. */
export function stampVillages(chunk: Chunk, gen: WorldGen): void {
  const baseX = chunk.cx * 16;
  const baseZ = chunk.cz * 16;
  const minRX = Math.floor((baseX - TOWN_RADIUS) / REGION);
  const maxRX = Math.floor((baseX + 15 + TOWN_RADIUS) / REGION);
  const minRZ = Math.floor((baseZ - TOWN_RADIUS) / REGION);
  const maxRZ = Math.floor((baseZ + 15 + TOWN_RADIUS) / REGION);

  const put = (wx: number, wy: number, wz: number, id: number): void => {
    if (wy < 1 || wy >= CHUNK_Y) return;
    if ((wx >> 4) !== chunk.cx || (wz >> 4) !== chunk.cz) return;
    chunk.set(wx & 15, wy, wz & 15, id);
  };

  for (let rx = minRX; rx <= maxRX; rx++) {
    for (let rz = minRZ; rz <= maxRZ; rz++) {
      for (const b of buildingsOf(rx, rz, gen)) {
        if (b.kind === "lamp") stampLamp(b, gen, put);
        else stampHouse(b, gen, put);
      }
    }
  }
}

function stampLamp(b: Building, gen: WorldGen, put: (x: number, y: number, z: number, id: number) => void): void {
  const base = gen.heightAt(b.bx, b.bz);
  for (let y = base + 1; y <= base + 3; y++) put(b.bx, y, b.bz, WOOD);
  put(b.bx, base + 4, b.bz, TORCH);
}

function stampHouse(b: Building, gen: WorldGen, put: (x: number, y: number, z: number, id: number) => void): void {
  const base = gen.heightAt(b.bx, b.bz);
  const roofY = base + WALL_H + 1;
  // Door faces +z, centred on that wall.
  for (let dx = -HALF; dx <= HALF; dx++) {
    for (let dz = -HALF; dz <= HALF; dz++) {
      const wx = b.bx + dx;
      const wz = b.bz + dz;
      const edge = Math.abs(dx) === HALF || Math.abs(dz) === HALF;
      const corner = Math.abs(dx) === HALF && Math.abs(dz) === HALF;

      // Foundation: top at `base`, with cobble stilts down to the local ground.
      const colH = gen.heightAt(wx, wz);
      put(wx, base, wz, edge ? COBBLESTONE : PLANKS);
      for (let y = base - 1; y > colH && y >= base - 6; y--) put(wx, y, wz, COBBLESTONE);

      // Clear the interior/wall column of any terrain or foliage.
      for (let y = base + 1; y <= roofY; y++) put(wx, y, wz, AIR);

      const isDoor = dz === HALF && dx === 0;
      if (corner) {
        for (let y = base + 1; y <= base + WALL_H; y++) put(wx, y, wz, WOOD); // log post
      } else if (edge && !isDoor) {
        for (let y = base + 1; y <= base + WALL_H; y++) {
          const window = y === base + 2 && (dx + dz) % 2 === 0;
          put(wx, y, wz, window ? GLASS : PLANKS);
        }
      }
      put(wx, roofY, wz, PLANKS); // flat plank roof
    }
  }

  // Furnishings on the interior floor.
  put(b.bx - 2, base + 1, b.bz - 2, CHEST);
  put(b.bx + 2, base + 1, b.bz - 2, CRAFTING_TABLE);
  if (b.variant % 2 === 0) put(b.bx + 2, base + 1, b.bz + 2, FURNACE);
  put(b.bx, base + WALL_H, b.bz, TORCH); // ceiling-ish torch for light
}
