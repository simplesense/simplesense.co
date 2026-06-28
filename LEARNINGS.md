# Learnings

Bugs found → tests added; gotchas; non-obvious fixes. Append newest at the bottom of
each section.

## Environment / host gotchas

- **No global `pnpm`** on the build host, and global npm install failed on perms.
  Fix: `corepack enable` / `corepack pnpm …` (pnpm@9.15.0 pinned via `packageManager`).
- **No Docker, no local Postgres, no `psql`.** Fix: PGlite for local/test DB (ADR-002);
  the pure engine needs no DB at all, so the analyzer test surface is unaffected.
- The working directory is nested inside the home-folder git repo; initialized a
  **dedicated** git repo at `/Users/satya/simplesense.co` so the project history is clean.

## Bugs → regression tests

- _(none yet)_
