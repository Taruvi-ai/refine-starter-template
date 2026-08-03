# Kaizen Category Options Spec

## Goal

Limit the My Kaizens category dropdown to the requested options.

## Changes

- `KAIZEN_CATEGORIES` now contains only `Productivity`, `Quality`, and `Other`.
- The Kaizen edit form normalizes legacy category values to `Other` so older records do not break the MUI select.
- The incentive preview sample default now uses `Productivity`, matching the shared dropdown options.

## Verification

- TypeScript should pass with `tsc --noEmit --pretty false`.
- Existing category chips may still display legacy saved values when records already contain them.
