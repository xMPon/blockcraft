# Blockcraft — Developer Guide

Minecraft-style browser voxel game. TypeScript + Three.js + Vite. Plain TS game loop — no React, no game engine.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server at `http://localhost:5173` |
| `npm test` | vitest unit tests (`tests/`) |
| `npm run build` | typecheck (`tsc --noEmit`) + production build |

## Architecture (`src/`)

| Module | Responsibility |
|---|---|
| `core/Engine.ts` | Three.js scene/camera/renderer, resize, RAF loop with clamped dt |
| `core/Input.ts` | Pointer lock, keyboard state, accumulated mouse deltas and clicks |
| `core/rng.ts` | mulberry32 PRNG + integer hash — all determinism flows through here |
| `world/Block.ts` | Block registry: ids, solid/opaque flags, atlas tiles, hotbar data |
| `world/Chunk.ts` | 16×64×16 voxels in a flat `Uint8Array` |
| `world/WorldGen.ts` | Seeded simplex heightmap, layers, sea-level water, trees |
| `world/ChunkMesher.ts` | Culled-face meshing → opaque + water `BufferGeometry` per chunk |
| `world/World.ts` | Chunk map, world-coord block access, streaming + mesh lifecycle |
| `world/TextureAtlas.ts` | Procedural 4×4 canvas atlas, 16px tiles, NearestFilter |
| `player/Player.ts` | AABB physics (axis-separated voxel collision), mouse look |
| `player/Raycast.ts` | Amanatides–Woo voxel DDA — pure, no three.js |
| `ui/Hotbar.ts`, `ui/Hud.ts` | DOM hotbar, crosshair, debug overlay, click-to-play overlay |

## Conventions

- **Worldgen must stay deterministic.** All randomness derives from the world seed via `core/rng.ts`. Never use `Math.random()` in `world/`.
- `world/Chunk.ts`, `world/WorldGen.ts`, and `player/Raycast.ts` stay free of DOM dependencies so vitest runs them in node.
- Block ids are stable contracts (saved worlds will depend on them) — append new blocks, never renumber.
- Mesher visibility rule: opaque blocks draw faces against non-opaque neighbours; water draws faces only against air.
- Chunk streaming: generation radius is render radius + 1 so chunk-border faces always mesh against real data.

## Future work (not started)

- Greedy meshing; web-worker meshing
- World persistence (IndexedDB)
- Day-night cycle, inventory, survival mechanics
