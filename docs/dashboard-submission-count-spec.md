# Dashboard Submission Count

## Issue

The dashboard `Total Submissions` KPI counted every `kaizen_ideas` row. Save-as-draft leaves draft rows without a generated `kaizen_id`, so K1/K2 draft remnants were counted along with submitted K1/K2/K3.

## Rule

Dashboard submission metrics count submitted Kaizens only:

- `kaizen_id` is not null.
- `status` is not `Draft`.

For PE/QA program dashboard, recent Kaizens and submission trend use the same submitted-only scope so draft remnants do not appear as program submissions.

## Affected File

- `src/pages/home/index.tsx`
