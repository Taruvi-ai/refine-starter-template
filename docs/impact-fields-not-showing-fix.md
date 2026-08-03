# Impact Fields Not Showing Fix

## Problem

The Kaizen detail page showed zeros for Quality impact fields even when the inputs were expected to appear.

The specific row checked, `KZN/2026/QA/002`, had these database values:

- `error_before = null`
- `error_after = null`
- `rework_time = null`
- `fte_saving = null`

The frontend detail page was formatting those null values as `0`, and the `kaizen-submit-idea` function was not persisting the newer FTE input fields during final submission.

## Fix

- `src/pages/kaizens/show.tsx` now displays missing impact inputs as `-` instead of converting them to zero.
- `kaizen-submit-idea` now persists:
  - `impacted_volume`
  - `time_saved`
  - `error_before`
  - `error_after`
  - `rework_time`
  - `total_time_saved`
  - `fte_saving`
- The submit function also calculates FTE saving server-side if the frontend does not send it.

Existing rows that were already submitted before this fix do not have recoverable impact input values unless they are re-entered.
