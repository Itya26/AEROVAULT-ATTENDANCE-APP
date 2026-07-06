---
name: scripts package dependency management
description: Adding new dependencies to the shared scripts/ workspace package (@workspace/scripts).
---

When adding a new dependency to `scripts/package.json` (e.g. to write a one-off seed script that needs `@workspace/db` or a hashing library):

1. If the package is already in the `pnpm-workspace.yaml` catalog, use `"catalog:"` as the version.
2. If it is NOT in the catalog (check with `grep <pkg> pnpm-workspace.yaml` first), pin an explicit semver version instead — `"catalog:"` will fail to resolve.
3. After editing `scripts/package.json`, run `pnpm install` (from within `scripts/` or at the root) to link the new deps before running the script — the edit alone does not install anything.

**Why:** `scripts` is a real workspace package, not a scratch folder; `workspace:*` and `catalog:` protocols only resolve for entries pnpm already knows about.
