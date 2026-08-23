# Contributing to BlockCraft

Thanks for helping improve BlockCraft.

BlockCraft was created with Claude AI. AI-assisted contributions are welcome,
but contributors are responsible for reviewing, testing, and licensing the code
and assets they submit.

## Development Setup

```bash
npm install
npm run dev
```

Run checks before opening a pull request:

```bash
npm test
npm run build
```

## Project Conventions

- Keep world generation deterministic. Randomness in `src/world/` should flow
  from the world seed through `src/core/rng.ts`.
- Do not renumber existing block ids. Saved worlds depend on stable ids.
- Keep pure simulation logic DOM-free where possible so it can run in Vitest.
- Prefer small, focused pull requests with a clear gameplay or technical goal.
- Add or update tests when changing chunk math, raycasts, worldgen, lighting,
  inventory rules, persistence, crafting, combat, or survival behavior.

## Pull Requests

1. Fork the repo and create a feature branch.
2. Make the smallest useful change.
3. Run `npm test` and `npm run build`.
4. Fill out the pull request template, including screenshots or a short clip for
   visible gameplay/UI changes.

## Issues

Use the issue templates for bugs and feature requests. For security-sensitive
reports, follow `SECURITY.md` instead of opening a public issue.
