# Remove Dashboard Customize Action Spec

## Goal

Remove the `Customize (4)` action from the home dashboard hero panel.

## Changes

- Remove the visible Customize button from the focus action card.
- Remove the dashboard widget count fetch because it only powered that button label.
- Remove now-unused imports and state for the widget count.

## Verification

- TypeScript should pass with `tsc --noEmit --pretty false`.
- No dev server or production build should be started for this change.
