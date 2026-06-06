# OZE-89 — Migration journal rebuild (runbook)

**Status:** plan only. This is deliberately NOT auto-applied — rebuilding the
Drizzle journal must be done against the real production schema, with a verified
backup, by a human. Doing it blind risks corrupting migration state on a live DB.

## The problem

- `apps/api/drizzle/meta/_journal.json` only records migrations up to
  `0011_custom_webhook`, but migration files exist through `0021_*`.
- Migrations 0012–0021 are applied at runtime by a `repairs[]` array of raw
  `ALTER TABLE ... IF NOT EXISTS` statements in `apps/api/src/db/migrate.ts`,
  outside Drizzle's journal.
- Result: two parallel sources of truth. A fresh `drizzle-kit` run and the live
  DB disagree; a new contributor can't tell which is authoritative. DD red flag.

Root cause (per the comment in `migrate.ts`): a past Railway WAL-loss incident
forced manual repairs that were never folded back into the journal.

## Goal

One authoritative migration chain: `drizzle-kit migrate` from an empty DB
produces exactly the production schema, and the `repairs[]` hack is deleted.

## Procedure (staging first, never prod-first)

1. **Backup prod**: `pg_dump --schema-only` AND a full `pg_dump`. Verify restore
   on a scratch DB before touching anything.
2. **Snapshot the real schema**: `pg_dump --schema-only` of prod → `prod.sql`.
3. **Generate a clean baseline** on a throwaway branch:
   - Spin an empty Postgres.
   - `pnpm db:migrate` (current journal → applies 0000–0011).
   - Diff that DB against `prod.sql` (e.g. `migra` or `pgquarrel`). The diff is
     exactly what 0012–0021 + the `repairs[]` added.
4. **Fold the diff into Drizzle**: update `db/schema.ts` so it matches prod, then
   `pnpm db:generate`. Confirm the generated migration's net effect equals the
   diff. Renumber/squash so the journal is contiguous through the new head.
5. **Mark already-applied migrations as applied on prod** without re-running them:
   insert the new migration hashes into `drizzle.__drizzle_migrations` so prod
   (which already has the columns) doesn't try to re-add them. Test this exact
   step on the staging restore from step 1.
6. **Delete `repairs[]`** from `migrate.ts`. Keep the connection-retry logic.
   Reconsider the `TOLERABLE_CODES` swallow — once the chain is clean, duplicate
   errors should be loud, not swallowed.
7. **Verify**: fresh empty DB → `pnpm db:migrate` → `pg_dump --schema-only` must
   be byte-identical (modulo ordering) to `prod.sql`. Add this as a CI check.

## Acceptance

- [ ] Empty-DB migrate reproduces prod schema exactly (CI-verified)
- [ ] `_journal.json` is contiguous through the current head
- [ ] `repairs[]` removed from `migrate.ts`
- [ ] Staging restore rehearsed before prod
