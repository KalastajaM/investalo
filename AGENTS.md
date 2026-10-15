# AGENTS.md

Instructions for AI coding agents working in this repository. Read this file in full before starting. The README covers what the app does and how to run it; this file covers how to change it.

## Project

Investalo is a property investment analyzer for buy-to-let apartments, built around Finnish tax and housing-company rules. React 18 + Vite frontend, Express 5 backend, PostgreSQL via Drizzle ORM, optional Claude features. TypeScript throughout, ESM (`"type": "module"`), Node 20.18+.

## Commands

| Command | Use |
|---|---|
| `npm ci` | Install dependencies |
| `npm run check` | TypeScript type check (`tsc`) |
| `npm test` | Vitest unit tests; no database or API key needed |
| `npm run build` | Production build into `dist/` |
| `npm run dev` | Dev server on http://localhost:5000; needs `DATABASE_URL` and `SESSION_SECRET` in `.env` |
| `npm run db:generate` | Generate a migration after editing `shared/schema.ts` |

Before every commit, run `npm run check`, `npm test` and `npm run build`. These are exactly what CI runs (`.github/workflows/ci.yml`); a change is not done until all three pass.

## Layout

- `client/src/lib/simulation.ts`: the simulation and tax engine. A pure function of a property and the user's settings, run in the browser. Tested in `tests/simulation.test.ts`.
- `client/src/lib/market-configs.ts`: market profiles (Finland, generic) and their tax defaults.
- `shared/schema.ts`: Drizzle tables and the Zod schemas generated from them, used by both API and forms. `shared/routes.ts` is the typed API contract.
- `server/routes.ts`: REST API. `server/storage.ts`: database access.
- `server/scraper.ts`, `server/analyzer.ts`, `server/market-analyzer.ts`: Claude features; shared helpers in `server/claude-utils.ts`.
- `server/safe-fetch.ts`: the only permitted way to fetch a user-supplied URL.
- `migrations/`: SQL migrations, applied automatically on server startup.

## Rules

- **Tax and simulation changes need tests.** Any change to `simulation.ts` or `market-configs.ts` comes with a test in `tests/simulation.test.ts` that pins the expected figures. Cite the legal basis (for example *varainsiirtoverolaki*) in a comment where a rule implements a specific statute. Keep Finnish legal terms such as *hankintameno-olettama*, *varainsiirtovero* and *rahoitusvastike* as they are; do not translate them in code or docs.
- **Schema changes go through migrations.** Edit `shared/schema.ts`, run `npm run db:generate`, and commit the generated SQL and `migrations/meta/` files. Never edit an existing migration.
- **User data is per user.** Every query is scoped by user ID. New tables get a user foreign key and new queries filter on it.
- **User-supplied URLs are untrusted.** Fetch them only through `safe-fetch.ts`; never call `fetch` on them directly.
- **Claude calls go through `claude-utils.ts`.** Use `CLAUDE_MODEL` (default `claude-haiku-5-5`, overridable by env) and `extractClaudeText()` to read responses; do not read `content[0]`, which may be a thinking block. Handle `stop_reason` values `refusal` and `max_tokens`. Claude endpoints are rate-limited per user via `server/rate-limiter.ts`, and the features must stay hideable with `CLAUDE_FEATURES=false`.
- **Configuration is documented in `.env.example`.** Add any new environment variable there with a comment. Never commit `.env` or secrets.
- **`DEV_MODE=true` signs every request in as a test user.** Never enable it, or code that assumes it, for production paths.
- Match the surrounding code style. Use the existing shadcn/ui components in `client/src/components/ui/` rather than adding new UI libraries.

## Releases

Versions follow semver; pre-releases use suffixes like `-alpha.1`. To cut a release:

1. Bump the version with `npm version <version> --no-git-tag-version` (updates `package.json` and `package-lock.json`).
2. Add a `# Release Notes — v<version> (<YYYY-MM-DD>)` section at the top of `RELEASE_NOTES.md`, ending with a `---` line, and a matching entry at the top of `client/src/data/releases/index.ts` (shown in the app under Settings → Release Notes).
3. Merge to `main`, then tag the merge commit `v<version>` and push the tag. `.github/workflows/release.yml` verifies the tag matches `package.json`, runs the checks and publishes the GitHub release with that section as its notes.

## Second Brain return leg

TODO: return-leg block, copy from Second Brain/RETURN-LEG.md
