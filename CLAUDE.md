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
| `core/Sky.ts` | Day/night clock → sky colour, day-light factor, sun direction |
| `core/ChunkMaterial.ts` | ShaderMaterial pair (opaque + water): bakes voxel light × day factor, manual fog |
| `world/Block.ts` | Block registry: ids, solid/opaque/layer flags, atlas tiles, hardness/tool/tier/light metadata |
| `world/Chunk.ts` | 16×128×16 voxels + skylight + blocklight in parallel flat `Uint8Array`s |
| `world/WorldGen.ts` | Seeded terrain: biomes, layered surface, 3D-noise caves, depth-banded ore veins, bedrock floor, sea-level water, trees |
| `world/Lighting.ts` | Per-chunk skylight + blocklight BFS; borders pull from lit neighbours (DOM-free) |
| `world/ChunkMesher.ts` | Culled-face meshing → opaque + water geometry; bakes per-vertex `aLight`; torch thin-pillar path |
| `world/World.ts` | Chunk map, world-coord block + light access, streaming, lighting + mesh lifecycle |
| `world/TextureAtlas.ts` | Procedural 8×8 canvas atlas, 16px tiles, NearestFilter |
| `physics/aabb.ts` | Shared swept-AABB-vs-voxels resolver (player + entities); DOM-free |
| `player/Player.ts` | Player physics (uses `physics/aabb`), mouse look, swimming, sprint, survival (health/air, fall, drowning, knockback hits, respawn) |
| `player/Raycast.ts` | Amanatides–Woo voxel DDA — pure, no three.js |
| `player/Mining.ts` | Hold-to-mine: break-time + harvest-tier gate (pure) + progress tracker |
| `player/Combat.ts` | Melee `attackDamage(stack)` by weapon tier (pure) |
| `player/Hunger.ts` | Food bar: exhaustion drain, eating, regen/starvation (pure, tested) |
| `item/Item.ts` | Item registry (block-items, materials, tools) + block→drop table |
| `item/ItemStack.ts` | Stack merge/split helpers (pure) |
| `item/Inventory.ts` | 36-slot inventory (9 hotbar): add/remove/has/consume |
| `item/Recipes.ts` | Shaped + shapeless crafting match + smelting/fuel tables (pure) |
| `block/Furnace.ts` | Per-furnace smelting state + coord-keyed registry, ticked by the loop |
| `entity/Entity.ts` | Entity base on `physics/aabb` (gravity + collision); mobs reuse it |
| `entity/ItemDrop.ts` | Bobbing/spinning item-drop entity, proximity pickup |
| `entity/Mob.ts` | Data-driven mob: boxy model, wander/flee/seek/attack AI, knockback hits, loot, creeper blast |
| `entity/MobTypes.ts` | The 7 mob definitions (pig/cow/sheep/chicken + zombie/spider/creeper) |
| `entity/Spawner.ts` | Light/time-gated spawning around the player with per-kind caps (gate is pure) |
| `ui/ItemSlots.ts` | Drag Cursor + SlotGrid (pick/place/merge/split) used by the modals |
| `ui/InventoryScreen.ts` | Modal inventory + 2×2/3×3 crafting grid (E, or a crafting table) |
| `ui/FurnaceUI.ts` | Modal furnace: input/fuel/output + flame & progress gauges |
| `ui/Hotbar.ts`, `ui/Hud.ts` | DOM hotbar (inventory row), crosshair, hearts/air, overlay |

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
Done: **Phase 2** — skylight + blocklight propagation, day/night cycle, placeable torches, fall damage, drowning, death/respawn, health + air HUD.
Done: **Phase 3a** — item registry + drop table, 36-slot inventory, item-drop entities with pickup, hold-to-mine with hardness/tool-speed + crack overlay + harvest-tier gate, shared AABB physics.
Done: **Phase 3b** — modal inventory + crafting (2×2 personal / 3×3 table), recipe registry (planks, sticks, table, tools, furnace, torches), furnace smelting with fuel, crafting table + furnace + glass blocks. Survival start (empty inventory).
Done: **Phase 4** — 7 mobs with AI (passive wander/flee, hostile seek/attack, creeper explosion), light/time-gated spawning, melee combat both ways (knockback + i-frames + hit flash), hunger bar (eat food, regen/starvation), sprint, mob loot + cookable meats. Swimming added (buoyancy + swim-up).
Next: persistence — world + inventory save/load (Phase 5); perf pass; polish.
