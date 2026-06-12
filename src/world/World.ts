// World: chunk map keyed by "cx,cz", world-coordinate block access, and
// streaming — generate around the player, mesh nearest-first within a
// per-frame budget, rebuild edited chunks immediately, drop far meshes.
import * as THREE from "three";
import { Chunk, CHUNK_Y } from "./Chunk";
import { WorldGen } from "./WorldGen";
import { meshChunk, type ChunkMaterials } from "./ChunkMesher";

export const RENDER_RADIUS = 6; // chunks meshed and visible
const GEN_RADIUS = RENDER_RADIUS + 1; // generated wider so border faces mesh against real data
const MESH_BUDGET_PER_FRAME = 4;

interface ChunkMeshes {
  solid: THREE.Mesh | null;
  water: THREE.Mesh | null;
}

export class World {
  private readonly chunks = new Map<string, Chunk>();
  private readonly meshes = new Map<string, ChunkMeshes>();
  private readonly dirty = new Set<string>();

  constructor(
    readonly gen: WorldGen,
    private readonly scene: THREE.Scene,
    private readonly materials: ChunkMaterials,
  ) {}

  private static key(cx: number, cz: number): string {
    return cx + "," + cz;
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(World.key(cx, cz));
  }

  getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = World.key(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.gen.generate(chunk);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  /** World-coordinate read; missing chunks and out-of-range y read as air. */
  getBlock(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= CHUNK_Y) return 0;
    const chunk = this.getChunk(wx >> 4, wz >> 4);
    return chunk ? chunk.get(wx & 15, wy, wz & 15) : 0;
  }

  setBlock(wx: number, wy: number, wz: number, id: number): void {
    if (wy < 0 || wy >= CHUNK_Y) return;
    const cx = wx >> 4;
    const cz = wz >> 4;
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return;
    chunk.set(wx & 15, wy, wz & 15, id);
    this.dirty.add(World.key(cx, cz));
    // A border edit changes which faces the neighbouring chunk must draw.
    const lx = wx & 15;
    const lz = wz & 15;
    if (lx === 0) this.dirty.add(World.key(cx - 1, cz));
    if (lx === 15) this.dirty.add(World.key(cx + 1, cz));
    if (lz === 0) this.dirty.add(World.key(cx, cz - 1));
    if (lz === 15) this.dirty.add(World.key(cx, cz + 1));
  }

  /** Per-frame streaming around the player position. */
  update(centerWx: number, centerWz: number): void {
    const pcx = Math.floor(centerWx) >> 4;
    const pcz = Math.floor(centerWz) >> 4;

    for (let cx = pcx - GEN_RADIUS; cx <= pcx + GEN_RADIUS; cx++) {
      for (let cz = pcz - GEN_RADIUS; cz <= pcz + GEN_RADIUS; cz++) {
        this.getOrCreateChunk(cx, cz);
      }
    }

    // Rebuild edited chunks in the same frame so block changes feel instant.
    for (const key of this.dirty) {
      if (this.meshes.has(key)) this.remesh(key);
    }
    this.dirty.clear();

    const wanted: { key: string; d: number }[] = [];
    for (let cx = pcx - RENDER_RADIUS; cx <= pcx + RENDER_RADIUS; cx++) {
      for (let cz = pcz - RENDER_RADIUS; cz <= pcz + RENDER_RADIUS; cz++) {
        const key = World.key(cx, cz);
        if (!this.meshes.has(key)) {
          wanted.push({ key, d: (cx - pcx) ** 2 + (cz - pcz) ** 2 });
        }
      }
    }
    wanted.sort((a, b) => a.d - b.d);
    for (const { key } of wanted.slice(0, MESH_BUDGET_PER_FRAME)) this.remesh(key);

    for (const [key, m] of this.meshes) {
      const [cx, cz] = key.split(",").map(Number);
      if (Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > RENDER_RADIUS + 1) {
        this.disposeMeshes(m);
        this.meshes.delete(key);
        // Chunk data stays in the map so player edits survive revisits.
      }
    }
  }

  private remesh(key: string): void {
    const old = this.meshes.get(key);
    if (old) this.disposeMeshes(old);
    const [cx, cz] = key.split(",").map(Number);
    const chunk = this.getOrCreateChunk(cx, cz);
    const m = meshChunk(this, chunk, this.materials);
    this.meshes.set(key, m);
    if (m.solid) this.scene.add(m.solid);
    if (m.water) this.scene.add(m.water);
  }

  private disposeMeshes(m: ChunkMeshes): void {
    for (const mesh of [m.solid, m.water]) {
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
      }
    }
  }
}
