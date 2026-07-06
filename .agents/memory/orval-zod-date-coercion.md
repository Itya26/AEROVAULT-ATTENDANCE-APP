---
name: Orval zod date query/param coercion
description: Query/path params with format date or date-time need explicit zod coercion configured in orval, otherwise validation silently fails.
---

Orval's zod client generates `zod.date()` (not `zod.coerce.date()`) for OpenAPI params with `format: date` or `format: date-time` unless `'date'` is included in the `coerce.query` / `coerce.param` arrays in `orval.config.ts`. Query/path values arrive as strings over HTTP, so an uncoerced `zod.date()` schema fails `safeParse` and the route returns a generic 400 with no obvious cause.

**Why:** A date query param (e.g. `?date=2026-07-06`) looked correct in the OpenAPI spec and in the route handler, but `ListAttendanceQueryParams.safeParse(req.query)` failed because the generated schema had `"date": zod.date().optional()` instead of `zod.coerce.date()`. The `coerce` config only listed `['boolean', 'number', 'string']` for query/param — `'date'` was missing, even though it was present for `body`/`response`.

**How to apply:** When adding or debugging a date-typed query or path parameter that produces unexplained 400s, check `lib/api-spec/orval.config.ts`'s `override.zod.coerce.query` / `coerce.param` arrays include `'date'`. After changing the config, rerun `pnpm --filter @workspace/api-spec run codegen` and verify the generated schema in `lib/api-zod/src/generated/api.ts` uses `zod.coerce.date()` for that param.
