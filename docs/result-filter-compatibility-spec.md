# Result Filter Compatibility Fix

## Context

The browser notification `RESULT.FILTER IS NOT A FUNCTION` is raised before the app receives filtered datatable rows. `logs/frontend.ndjson` was not present, so the stack was traced from the installed packages and app usage.

## Resources And Providers

- Refine resources are registered in `src/App.tsx`.
- Datatable CRUD routes through `taruviDataProvider` in `src/providers/refineProviders.ts`.
- The provider package is `@taruvi/refine-providers@1.3.3`.
- The installed SDK is `@taruvi/sdk@1.5.1`.

## Root Cause

`@taruvi/refine-providers` calls `Database.filter(...)` when applying Refine filters and `getMany` ID filters. The installed SDK exposes the method as `Database.filters(...)`, so every filtered provider call can throw before hitting the network.

## Affected Files

- `src/providers/refineProviders.ts`: adds a compatibility alias from `filter` to `filters` before provider instances are created.

## Verification

Run TypeScript without building the app. Do not run `npm run dev` or `npm run build`; the repo notes say the dev server is already running.
