# Dashboard Card Rearrangement Spec

## Goal

Make the home dashboard easier to scan after simplifying the impact card.

## Changes

- Keep the hero and KPI summary at the top.
- Order KPI cards by workflow: total, in progress, approved, closed, rejected.
- Promote Recent Ideas as the first work card below the KPIs.
- Pair the smaller My Impact card with Certificates in the right-side desktop column.
- Move Submission Trend below Recent Ideas so the larger chart does not dominate the first working view.
- Use responsive grid areas so mobile reads: Recent Ideas, My Impact, Certificates, Submission Trend.

## Verification

- TypeScript should pass with `tsc --noEmit --pretty false`.
- No dev server or production build should be started for this change.
