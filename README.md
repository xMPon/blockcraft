# BlockCraft

[![CI](https://github.com/xMPon/blockcraft/actions/workflows/ci.yml/badge.svg)](https://github.com/xMPon/blockcraft/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/xMPon/blockcraft/actions/workflows/deploy.yml/badge.svg)](https://github.com/xMPon/blockcraft/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Minecraft-style voxel sandbox that runs in the browser. TypeScript + Three.js, no game engine.

**Play in your browser:** https://xmpon.github.io/blockcraft/

## Attribution

BlockCraft was created with Claude AI.

## Features

- Procedural terrain from seeded simplex noise: hills, beaches, sea-level water, trees
- Chunked world with culled-face meshing and baked directional shading
- First-person physics: AABB voxel collision, gravity, jumping, swimming
- Break and place blocks via voxel DDA raycast, with a wireframe target highlight
- Hotbar and inventory, crafting grid, crafting table, furnace smelting
- Survival systems: health, hunger, fall damage, drowning, swimming, day/night
- Mobs with AI: passive animals plus hostile zombie, spider, and creeper
- World and inventory save/load in IndexedDB, with auto-save
- Procedurally drawn texture atlas and WebAudio sound, with no bundled art/audio assets

## Quick Start

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Controls

| Input | Action |
| --- | --- |
| Click | Capture mouse with pointer lock |
| WASD | Move |
| Double-tap W | Sprint |
| Mouse | Look |
| Space | Jump / swim up |
| Left click, hold | Mine block / attack mob |
| Right click | Place block / open table or furnace / eat food |
| E | Open inventory and crafting |
| 1-9 / mouse wheel | Select hotbar slot |
| Esc | Pause menu / close screen |

## Tests

```bash
npm test
npm run build
```

Unit tests cover chunk math, raycast, world generation, lighting, mining and drops,
crafting and smelting, combat, hunger, spawning, and save serialization.

## Manual Smoke Checklist

- Punch a tree, craft planks, build a crafting table, make tools, and mine stone or ores
- Build a furnace, smelt iron ore, and cook meat
- Dig into a dark cave and place torches to light it
- Survive nightfall by fighting hostile mobs and managing hunger
- Place a block, refresh the page, and confirm edits and inventory persist

## Project Health

BlockCraft includes the core open source project basics: an MIT license, contribution
guide, code of conduct, security policy, changelog, issue templates, pull request
template, CI, dependency update configuration, and a GitHub Pages deploy workflow.

See [docs/OPEN_SOURCE_AUDIT.md](docs/OPEN_SOURCE_AUDIT.md) for the audit notes and
remaining recommendations.

## Roadmap

See [`TODO.md`](TODO.md) for the categorized backlog, including gameplay
expansion, rendering performance, user experience, and maintenance work.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), then open
an issue or pull request using the GitHub templates.

## Security

Please follow [SECURITY.md](SECURITY.md) when reporting vulnerabilities or abuse
cases.

## License

MIT. See [LICENSE](LICENSE).
