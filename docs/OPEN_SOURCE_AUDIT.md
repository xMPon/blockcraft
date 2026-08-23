# Open Source Audit

Date: 2026-08-23

## Summary

BlockCraft is already in good shape as a public technical project: it has a
playable hosted demo, a clear architecture, strict TypeScript, unit tests, and a
GitHub Pages deployment workflow. The main gaps were community, legal, and
maintenance files that help people understand how to use, trust, and contribute
to the project.

BlockCraft was created with Claude AI.

## Added in This Audit

| Area | Addition | Why it matters |
| --- | --- | --- |
| License | `LICENSE`, package `license` metadata | Gives users clear legal permission to use and modify the project |
| README | Badges, attribution, project health, cleaner setup and roadmap | Makes the repo easier to evaluate quickly |
| Contributions | `CONTRIBUTING.md` | Explains local setup, project rules, and PR expectations |
| Conduct | `CODE_OF_CONDUCT.md` | Sets collaboration expectations |
| Security | `SECURITY.md` | Gives a safe path for vulnerability reports |
| Changes | `CHANGELOG.md` | Creates a place to track release notes |
| GitHub issues | Bug and feature templates | Helps reports arrive with useful reproduction details |
| Pull requests | PR template | Keeps review context consistent |
| CI | `.github/workflows/ci.yml` | Runs tests and builds on pull requests |
| Maintenance | `.github/dependabot.yml` | Opens dependency and GitHub Actions update PRs |
| Dependency security | `npm audit fix` lockfile update | Updated vulnerable `nanoid` and `postcss` transitive packages |
| Formatting | `.editorconfig` | Keeps editor defaults consistent |
| Git hygiene | `.gitattributes` | Keeps text line endings consistent across operating systems |
| Package metadata | Repository, homepage, bugs, keywords, engines | Improves discoverability and tooling metadata |

## Already Present

- Playable browser demo at `https://xmpon.github.io/blockcraft/`
- `npm test` coverage across core game systems
- `npm run build` typecheck and production build
- GitHub Pages deployment workflow
- `CLAUDE.md` developer guide with module map and project conventions
- Procedural assets, so there is no bundled art/audio provenance risk right now

## Recommended Next Steps

- Add screenshots or a short gameplay GIF to the README.
- Add tagged releases once the project has stable milestones.
- Add a browser support note, especially around pointer lock, WebGL, WebAudio,
  and IndexedDB.
- Add a simple performance budget or benchmark notes for chunk generation and
  meshing.
- Split the main browser bundle or tune chunk-size budgeting. The production
  build currently succeeds but warns that the minified client chunk is over
  500 kB.
- Consider ESLint/Prettier if contributor volume increases.
- Add asset provenance rules before accepting external textures, models, or
  audio.
- Enable GitHub private vulnerability reporting in repository settings if this
  repo is public.
