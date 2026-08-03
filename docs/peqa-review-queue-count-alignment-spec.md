# PE/QA Review Queue Count Alignment

## Request

For a PE/QA user, the dashboard Review Focus card showed more waiting items than the Review Queue displayed after clicking Open Reviews.

## Cause

The Review Queue defaulted from the generic `Submitted` status to the first PE/QA status option, `Approved`, which narrowed the PE/QA list and hid other Kaizens already waiting in the `PE/QA Audit` stage.

## Implementation

- Added a shared `PE_QA_REVIEW_STAGE` constant for the PE/QA audit stage.
- For PE/QA users, an empty/default Status filter now means `current_stage = "PE/QA Audit"`.
- Invalid generic statuses, such as the initial `Submitted` default, now render as a blank Status dropdown for PE/QA and do not create a misleading active filter chip.
- Selecting an explicit PE/QA status still filters by that status.

## Files

- `src/pages/reviews/index.tsx`
