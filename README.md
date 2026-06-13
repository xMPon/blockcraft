# Blockcraft

A Minecraft-style voxel sandbox that runs in the browser. TypeScript + Three.js, no game engine.

**Features**

- Procedural terrain from seeded simplex noise — hills, beaches, sea-level water, trees
- Chunked world (16×64×16 chunks) with culled-face meshing and baked directional shading
- First-person physics: AABB voxel collision, gravity, jumping
- Break and place blocks via voxel DDA raycast, with a wireframe target highlight
- Hotbar block selection, crosshair, FPS/position debug overlay
- Procedurally drawn texture atlas — zero art assets

## Run

```bash
npm install
npm run dev    # http://localhost:5173
```

## Controls

| Input | Action |
|---|---|
| Click | Capture mouse (pointer lock) |
| WASD | Move |
| Mouse | Look |
| Space | Jump / swim up |
| Left click (hold) | Mine block |
| Right click | Place block / open table or furnace |
| E | Open inventory + crafting |
| 1–9 / mouse wheel | Select hotbar slot |
| Esc | Release mouse / close screen |

## Tests

```bash
npm test
```

Unit tests cover chunk index math, the voxel DDA raycast, and worldgen determinism.

## Manual smoke checklist

- Walk and jump; collision stops you at terrain
- Look around under pointer lock
- Break a block (left click) — it disappears and exposed faces render
- Place each hotbar block type (right click)
- Walk toward the horizon — new chunks stream in, far ones unload

## Future work

- Greedy meshing and web-worker chunk meshing
- World persistence (IndexedDB)
- Day-night cycle, inventory, survival mechanics
