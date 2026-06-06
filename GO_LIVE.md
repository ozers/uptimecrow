# Go-Live Checklist

Local repo is ready. Everything in this checklist is something a human (you) has to do — Claude can't push to GitHub on your behalf.

## Before you push

- [ ] Decide the final history strategy.
      Local main currently has the full pre-launch history including the now-untracked `.wolf/`, `.claude/`, and internal-docs commits. The agreed plan is to **squash to a single "Initial public release" commit** for the public mirror while keeping this local repo as the private backup. Confirm you still want this; alternative is a `git filter-repo` history rewrite.
- [ ] Pick a final image tag scheme. The Deploy workflow tags as `latest`; consider also tagging `v0.1.0` on the first release.
- [ ] Set up a fresh personal email or `security@uptimecrow.com` inbox so [SECURITY.md](./SECURITY.md) reports actually reach you.

## Create the GitHub repo

1. Sign in to GitHub as `ozers`.
2. New repository → name: `uptimecrow`, owner: `ozers`, **public**, do NOT initialize with README/license/.gitignore (we have our own).
3. Enable **Discussions** under Settings → Features.
4. Enable **Security advisories** under Settings → Security.
5. Settings → Branches → add a rule for `main`: require PR before merging, require status checks to pass (we'll add the checks after the first push so CI runs first).

## Push (squashed)

```bash
# In this repo:
git remote add public git@github.com:ozers/uptimecrow.git
git checkout --orphan release/public
git add .
git commit -m "Initial public release (AGPL-3.0)" \
  -m "UptimeCrow — open-source uptime monitoring and status pages." \
  -m "See OPEN_CORE.md for what's in scope here vs managed-only."
git push public release/public:main
```

Verify on github.com/ozers/uptimecrow that the file tree looks right.

## First CI run

The Deploy workflow on `main` will trigger automatically:

1. Watch the Actions tab. Both `CI` and `Deploy` workflows should run.
2. `Deploy` builds and pushes `ghcr.io/ozers/uptimecrow/api:latest` and `ghcr.io/ozers/uptimecrow/web:latest` to GitHub Container Registry.
3. Confirm the two packages appear under github.com/ozers?tab=packages.

If CI is red, fix locally and force-push the orphan branch again (this is your one window — once you have any external watchers, force-pushes get hostile).

## Smoke-test the public images

Once GHCR images exist, the prod compose file actually works. From any fresh VPS (or even your laptop):

```bash
curl -O https://raw.githubusercontent.com/ozers/uptimecrow/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/ozers/uptimecrow/main/.env.prod.example
cp .env.prod.example .env
# Edit .env: openssl rand -hex 32 for JWT_SECRET, openssl rand -hex 24 for POSTGRES_PASSWORD, APP_URL=http://<vps-ip>
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f api
# Open http://<vps-ip>/ — register a user → create a monitor → wait 1 minute → check that the check ran
```

This is the exact flow that was validated locally before commit `9d72433`. It should "just work."

## Launch sequence (after smoke test passes)

Recommended order, spaced over a week so each landing has its own moment:

1. **Day 1 — Soft launch:** Your Twitter / Mastodon / LinkedIn. Existing newsletter if any. "It's live, here's the repo."
2. **Day 2 — r/selfhosted, r/devops** (Monday morning US time). Short personal note + link, not a copy of the README.
3. **Day 3 — Show HN** (Tuesday 8–10 AM PST). Suggested title: `Show HN: UptimeCrow – open-source uptime monitoring with an MCP server (AGPL, Docker)`. Be at the keyboard for the first 2 hours. Reply to every comment.
4. **Day 4 — Product Hunt** (Wednesday).
5. **Week 1 — Awesome lists.** Open PRs to:
   - [`awesome-selfhosted/awesome-selfhosted`](https://github.com/awesome-selfhosted/awesome-selfhosted) → Monitoring section
   - [`Awesome-Uptime`](https://github.com/) (if there's an active one)
   - `awesome-status-pages` if you find one
6. **Week 2-4 — Content:**
   - Blog post: "Why we open-sourced UptimeCrow"
   - Blog post: "BetterStack vs UptimeCrow: when to self-host"
   - Cross-post to dev.to with canonical link back to your domain.

## Things to deliberately *not* do before launch

- Don't set up the Polar / Open Collective sponsor button until you've decided you want one. Adding it later is a single small PR.
- Don't tweak pricing on the landing page mid-launch — the AGPL switch + open core narrative is already enough new signal.
- Don't promise features ("v0.2 will have SSO!"). Roadmap conversations after first launch get free input from real users.

## If something goes wrong

- **CI red on first push:** read the failing job, fix locally, force-push orphan branch (only safe while no one has cloned). Or push a fix commit on top.
- **GHCR images don't build:** check `apps/api/Dockerfile` and `apps/web/Dockerfile` — they're the same files validated locally, so the most likely cause is a CI runner missing buildx (the workflow already sets up `docker/setup-buildx-action`).
- **Show HN flops:** that's normal. Most launches don't go viral. The slow burn of awesome-list PRs + Reddit + content does the real work over weeks.
- **First malicious issue/PR:** stay calm. Lock the thread, report if abusive, otherwise just close with one sentence. Don't engage.

## Local repo state at hand-off

```
Branch: main
Recent commits (newest first):
  9d72433 Fix production Docker build (3 bugs preventing self-host)
  3f21e25 Pre-push cleanup: untrack .claude/, simplify CLAUDE.md, fix stale retention tests
  9670277 Add production docker-compose for self-host
  e17ec50 Untrack .wolf/ and internal-only docs
  1e406fb Open-source the project under AGPL-3.0
  ccd516b  ← this commit and earlier are pre-AGPL (private history)
```

The squash to "Initial public release" should collapse `9d72433` through `1e406fb` (or all the way back to repo root, depending on how clean you want the public history).
