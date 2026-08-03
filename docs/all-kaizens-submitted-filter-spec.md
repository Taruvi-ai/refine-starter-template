# All Kaizens Submitted Filter Spec

## Issue

The PE/QA All Kaizens list was querying every `kaizen_ideas` row. Draft staging rows for K1 and K2 were returned together with their submitted records, so users saw five rows instead of the three real Kaizens.

## Expected behavior

- Program-level All Kaizens shows submitted Kaizens only.
- Draft staging rows remain visible only in submitter-owned My Kaizens views.
- Server-side filters keep pagination totals aligned with the visible rows.

## Implementation

Apply submitted-only filters to the program list query:

- `kaizen_id` must be present.
- `status` must not be `Draft`.

