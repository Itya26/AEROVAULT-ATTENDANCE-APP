---
name: Orval query hooks require explicit queryKey
description: TypeScript errors when using generated React Query hooks with a custom `query` options object.
---

When calling an Orval-generated `use*` query hook (from `@workspace/api-client-react`) and passing a `query` options object (e.g. to set `enabled`), TypeScript requires `queryKey` to also be present — omitting it produces `TS2741: Property 'queryKey' is missing`.

**Why:** The generated hook types extend `UseQueryOptions`, which makes `queryKey` a required field once you pass any `query` object override, even though the hook computes a default queryKey internally when no options are passed.

**How to apply:** Each generated hooks file also exports a matching `get<HookName>QueryKey(params)` function. Import it alongside the hook and pass it explicitly:

```ts
import { useListLeaves, getListLeavesQueryKey } from "@workspace/api-client-react";

const { data } = useListLeaves(
  { employeeId },
  { query: { enabled: !!user, queryKey: getListLeavesQueryKey({ employeeId }) } }
);
```

Pass the same params to `getListLeavesQueryKey` as to the hook itself so cache invalidation (`queryClient.invalidateQueries`) matches correctly.
