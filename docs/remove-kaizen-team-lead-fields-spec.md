# Remove Kaizen Team Lead Fields Spec

## Goal

Remove the Team Lead and Team Lead Email inputs from the Kaizen create/edit form.

## Changes

- Removed the visible Team Lead row from the Routing section.
- Kept the underlying fields/types intact so existing records and backend schema remain compatible.

## Verification

- TypeScript should pass with `tsc --noEmit --pretty false`.
