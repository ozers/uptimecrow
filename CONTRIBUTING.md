# Contributing to UptimeCrow

Thanks for considering a contribution. This guide covers how to set up a dev environment, the kinds of changes we accept, and how to get a PR merged.

## Quick links

- Found a bug? [Open an issue](https://github.com/ozers/uptimecrow/issues/new?template=bug.md).
- Got a feature idea? [Start a discussion](https://github.com/ozers/uptimecrow/discussions) first — we want to align on shape before you spend hours on a PR.
- Security issue? **Do not open a public issue.** See [SECURITY.md](./SECURITY.md).
- Want to know what's open core vs managed-only? See [OPEN_CORE.md](./OPEN_CORE.md).

## Development setup

Prerequisites:

- Node.js 20.12+
- pnpm 9+
- Docker + Docker Compose (recommended) **or** local PostgreSQL 16 + Redis 7

### With Docker (easiest)

```bash
git clone https://github.com/ozers/uptimecrow.git
cd uptimecrow
cp .env.example .env
docker compose up
```

Web: http://localhost:5173 · API: http://localhost:3000

### Without Docker

```bash
pnpm install
cp .env.example .env
# Edit .env with your local PostgreSQL and Redis URLs

pnpm --filter @uptimecrow/shared build
pnpm db:migrate
pnpm dev:api    # http://localhost:3000
pnpm dev:web    # http://localhost:5173
```

Tip: `@uptimecrow/shared` must be built once before the web app can resolve it.

## What we welcome

- **Bug fixes** — any size, just include a reproduction
- **New notification integrations** — there is a clean pattern in `apps/api/src/services/notification.service.ts`
- **Performance improvements** — measure before and after, please
- **Documentation** — typos, clarifications, missing details — all welcome
- **Tests** — coverage for previously untested code paths

## What we'll likely push back on

- **New billing providers** — we are standardized on Polar; please don't add a parallel Stripe/Lemon Squeezy track without discussing first
- **Major architectural rewrites** — open a discussion first, do not surprise us with a 4,000-line PR
- **Features that belong in managed-only** — see [OPEN_CORE.md](./OPEN_CORE.md). SSO, audit logs, multi-region orchestration etc. are out of scope here
- **Breaking changes to the public REST API** without a clear migration path

## Pull request checklist

Before opening a PR:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] You added or updated tests for new behavior
- [ ] You ran the affected code locally and confirmed it works (not just that it compiles)
- [ ] If you touched the dashboard UI, include a screenshot in the PR description
- [ ] If you added a database column, you also generated and committed a Drizzle migration

Keep PRs focused. One logical change per PR. Smaller PRs review faster.

## Commit messages

We follow a relaxed conventional-commits style:

```
type: short summary

Optional longer body explaining *why*.
```

`type` is one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`. The summary should be imperative ("Add", "Fix", "Update") and under 70 characters.

## Code style

- TypeScript strict mode is enabled. We do not accept `any` without a comment justifying it.
- There is no linter yet, so style is settled in review: match the file you are editing. Comment density, naming and structure vary by area on purpose — the API services read differently from the React pages.
- Prefer composition over inheritance, prefer explicit imports over barrel re-exports.
- Don't ship dead code. If you removed a feature, delete the supporting code and tests.

## License of contributions

Contributions are licensed under AGPL-3.0, the project license.

We also ask contributors to accept a short [Contributor Licence Agreement](./CLA.md). You keep the copyright to your code; the CLA grants the maintainer a licence broad enough to ship it, including in a commercially licensed edition — see [OPEN_CORE.md](./OPEN_CORE.md) for why that boundary exists. Signing is one line in your PR description.

This was introduced while the project had no outside contributions, so nothing anyone has already written is affected: no existing contribution has been or will be relicensed without its author's explicit consent.

Don't want to sign? That is a fair position, and you can still help: open an issue with the bug or the design proposal. A precise report is worth as much as a patch and needs no paperwork.

The project name and logo are covered separately — see [TRADEMARK.md](./TRADEMARK.md).

## Community

- [GitHub Discussions](https://github.com/ozers/uptimecrow/discussions) — questions, ideas, show & tell
- [GitHub Issues](https://github.com/ozers/uptimecrow/issues) — bugs, concrete feature requests with a reproduction or spec

Please follow our [Code of Conduct](./CODE_OF_CONDUCT.md). In short: be kind, be specific, assume good faith.
