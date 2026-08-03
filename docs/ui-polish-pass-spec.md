# UI Polish Pass Spec

## Scope

Improve the first-run and everyday feel of the app without changing backend schemas, providers, routes, or resource names.

## Affected Areas

- `src/pages/home/index.tsx`: dashboard hierarchy, KPI cards, next-action guidance, empty states, and row affordances.
- `src/components/sidenav/MuiSidenav.tsx`: desktop sidebar affordances, search clear action, and visible logout.
- `src/components/sidenav/MenuItem.tsx`: collapsed tooltips and cleaner rounded icon usage.
- `src/components/sidenav/MobileBottomNav.tsx`: mobile menu/logout usability.

## Design Rules

- Use existing MUI components and Taruvi tokens from `themeOptions.ts`.
- Keep live data from existing Refine hooks and Taruvi functions.
- Do not introduce a new notification/toast system.
- Do not run `npm run dev` or `npm run build`; the dev server is already running.

## Verification

Run TypeScript only and inspect `logs/frontend.ndjson` if present.
