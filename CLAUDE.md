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
| `world/Block.ts` | Block registry: ids, solid/opaque/layer flags, atlas tiles, hardness/tool/tier/light metadata |
| `world/Chunk.ts` | 16×128×16 voxels in a flat `Uint8Array` |
| `world/WorldGen.ts` | Seeded terrain: biomes, layered surface, 3D-noise caves, depth-banded ore veins, bedrock floor, sea-level water, trees |
| `world/ChunkMesher.ts` | Culled-face meshing → opaque + water `BufferGeometry` per chunk |
| `world/World.ts` | Chunk map, world-coord block access, streaming + mesh lifecycle |
| `world/TextureAtlas.ts` | Procedural 8×8 canvas atlas, 16px tiles, NearestFilter |
| `player/Player.ts` | AABB physics (axis-separated voxel collision), mouse look |
| `player/Raycast.ts` | Amanatides–Woo voxel DDA — pure, no three.js |
| `ui/Hotbar.ts`, `ui/Hud.ts` | DOM hotbar, crosshair, debug overlay, click-to-play overlay |

## Conventions

- **Worldgen must stay deterministic.** All randomness derives from the world seed via `core/rng.ts`. Never use `Math.random()` in `world/`.
- `world/Chunk.ts`, `world/WorldGen.ts`, and `player/Raycast.ts` stay free of DOM dependencies so vitest runs them in node.
- Block ids are stable contracts (saved worlds will depend on them) — append new blocks, never renumber.
- Mesher visibility rule: water draws faces only against air; everything else draws against any non-opaque neighbour, skipping boundaries shared with the same block id (so adjacent leaves/glass don't draw internal faces).
- Chunk streaming: generation is budgeted per frame — `World.remesh()` generates a chunk and its four lateral neighbours on demand so border faces still mesh against real data without bursting the whole radius (caves + 128-tall chunks make generation the heavy work).
- **Verification handle:** `main.ts` exposes `window.__bc = { engine, world, player, input, hud }`. When the preview tab is backgrounded the render loop is throttled, so verify headlessly: loop `world.update(...)` to force-stream, call `engine.renderer.render(...)`, then read `renderer.info.render` or `gl.readPixels` / `world.getBlock`.

## Roadmap

Building toward a Minecraft Beta-level survival game in phases (see the plan).
Done: **Phase 1** — caves, ores, biomes, bedrock, 128-tall chunks.
Next: lighting + day/night + survival physics; items/crafting/smelting; mobs + combat + hunger; persistence.
