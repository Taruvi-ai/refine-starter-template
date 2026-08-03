# FTE Saving Impact Spec

## Goal

Show category-specific FTE saving.

Productivity:

`Impacted Month Volume * Time Saved / 9600`

Quality:

`(Error Before - Error After) * Rework Time / 9600`

Other:

`Total Time Saved / 9600`

## Changes

- Added `impacted_volume`, `time_saved`, `error_before`, `error_after`, `rework_time`, `total_time_saved`, and `fte_saving` fields to `kaizen_ideas`.
- Added shared FTE helpers in `src/pages/kaizens/shared.tsx`.
- Kaizen create/edit now shows Productivity-only inputs:
  - Impacted Month Volume
  - Time Saved (minutes)
  - FTE Saving, calculated read-only
- Kaizen create/edit now shows Quality-only inputs:
  - Error Before
  - Error After
  - Rework Time per Transaction (minutes)
  - FTE Saving, calculated read-only
- Kaizen create/edit now shows Other-only inputs:
  - Total Time Saved (minutes)
  - FTE Saving, calculated read-only
- Kaizen detail overview now shows FTE Saving and Productivity inputs.
- My Kaizens list now shows FTE Saving instead of Stage.
- Home My Impact now includes Total FTE Saving.

## Notes

- `9600` represents the FTE denominator used by the requested formulas.
- Category-specific inputs are cleared when a different category is selected.
