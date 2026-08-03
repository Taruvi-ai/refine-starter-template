# Sidebar Layout Fix

## Context

The expanded desktop sidebar was overlapping page content. The app uses Refine's `ThemedLayout`, a custom permanent MUI `Drawer`, and a top `Navkit` bar.

## Resources And Providers

- App shell and routes live in `src/App.tsx`.
- Sidebar geometry and menu behavior live in `src/components/sidenav/MuiSidenav.tsx`.
- Design guidance comes from `UI_Guidelines.md`, which defines desktop sidebar widths as local constants in `MuiSidenav.tsx`.

## Root Cause

The drawer paper changed width between collapsed and expanded states, but the drawer root did not reserve that width in Refine's flex layout. Page content was manually shifted by a fixed `72px` margin in `App.tsx`, so it only matched the collapsed sidebar width.

## Fix

- Reserve the current sidebar width on the `Drawer` root in `MuiSidenav.tsx`.
- Remove the fixed content margin in `App.tsx` so Refine's flex layout handles the offset for both sidebar states.

## Verification

Run TypeScript only. Do not run `npm run dev` or `npm run build`; the development server is already running.
