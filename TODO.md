# BlockCraft TODO

Remaining work, grouped by area. The core five planned phases are complete; these items are polish, expansion, and release work.

## Gameplay

- [ ] Add flowing water simulation and block updates.
- [ ] Add skeleton mobs with ranged attacks and arrow projectiles.
- [ ] Add more block types, recipes, and survival content as the world expands.

## Performance and rendering

- [ ] Move chunk meshing to a web worker without breaking deterministic world data access.
- [ ] Add greedy meshing and compare it with culled-face meshing.
- [ ] Split the main browser bundle or tune chunk-size budgeting to remove the production bundle warning.
- [ ] Add a repeatable performance budget for chunk generation, lighting, meshing, and frame time.

## User experience

- [ ] Add browser support guidance for pointer lock, WebGL, WebAudio, and IndexedDB.
- [ ] Add screenshots or a short gameplay GIF to the README.
- [ ] Add clearer loading/progress feedback while chunks are generated and meshed.

## Quality and maintenance

- [ ] Add browser smoke tests for world creation, mining, crafting, saving, loading, and respawn.
- [ ] Add tagged releases for stable milestones and document the release process.
- [ ] Add asset provenance rules before accepting external textures, models, or audio.
- [ ] Consider ESLint and Prettier when contributor volume justifies the maintenance cost.
- [ ] Enable GitHub private vulnerability reporting for the public repository.
