# Dashboard Derived Hours

## Objective

Show meaningful saved-hours metrics for newly submitted Kaizens before review writes the explicit `hours_saved` value.

## Data flow

- Prefer `hours_saved` when it has been recorded by the review workflow.
- Otherwise derive hours from the submitted category inputs:
  - Productivity: `impacted_volume * time_saved / 60`
  - Quality: `(error_before - error_after) * rework_time / 60`
  - Other: `total_time_saved / 60`
- Use the same resolved value for the dashboard total and leaderboards.

## Affected files

- `src/pages/kaizens/shared.tsx`
- `src/pages/home/index.tsx`

## Verification

- Two current submissions resolve to `727.17` total hours.
- An explicit `hours_saved` value continues to take precedence.
- TypeScript validation passes.
