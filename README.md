# Blockcraft

A Minecraft-style voxel sandbox that runs in the browser. TypeScript + Three.js, no game engine.

**Features**

- Procedural terrain from seeded simplex noise — hills, beaches, sea-level water, trees
- Chunked world (16×64×16 chunks) with culled-face meshing and baked directional shading
- First-person physics: AABB voxel collision, gravity, jumping
- Break and place blocks via voxel DDA raycast, with a wireframe target highlight
- Hotbar + full inventory, crafting grid (2×2 / 3×3 table), furnace smelting
- Survival: health, hunger, fall damage, drowning, swimming, day/night
- Mobs with AI — passive animals + hostile zombie/spider/creeper, melee combat
- World + inventory save/load (IndexedDB) — survives a refresh; auto-saves
- Procedurally drawn texture atlas + WebAudio sound — zero art/audio assets

## Run

```bash
npm install
npm run dev    # http://localhost:5173
```

## Controls

| Input | Action |
|---|---|
| Click | Capture mouse (pointer lock) |
| WASD (double-tap W) | Move (sprint) |
| Mouse | Look |
| Space | Jump / swim up |
| Left click (hold) | Mine block / attack mob |
| Right click | Place block · open table/furnace · eat food |
| E | Open inventory + crafting |
| 1–9 / mouse wheel | Select hotbar slot |
| Esc | Pause menu (save / new world) / close screen |

## Tests

```bash
npm test
```

Unit tests (58) cover chunk math, raycast, worldgen, lighting, mining/drops,
crafting/smelting, combat/hunger/spawning, and save serialization.

## Manual smoke checklist

- Punch a tree → craft planks → table → tools; mine stone and ores
- Build a furnace, smelt iron ore and cook meat
- Dig into a dark cave, place torches to light it
- Survive nightfall — fight zombies/spiders/creepers; keep the hunger bar up
- Place a block, refresh the page — your edits and inventory are still there

## Future work

- Skeleton + arrows (ranged mob), greedy + web-worker meshing, flowing water
- Day-night cycle, inventory, survival mechanics
