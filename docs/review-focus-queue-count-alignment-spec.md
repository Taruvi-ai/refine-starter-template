# Review Focus Queue Count Alignment

## Request

The Team Dashboard `Review Focus` card showed a non-zero number of waiting items, but opening the review queue showed no records.

## Cause

The Team Dashboard built Lead/Manager pending review filters as one backend filter tree. The Review Queue page mixed normal Refine filters with the raw backend `filters` tree used for Lead/Manager scope. That made the two screens ask the backend different questions.

## Implementation

- Exported the backend filter-tree helpers from `src/pages/kaizens/shared.tsx`.
- Added `leadManagerIdeaFilterNodes` so pages can compose the Lead/Manager scope into larger backend filter trees.
- Updated `src/pages/reviews/index.tsx` so Lead/Manager queues combine status, stage, search, department, employee, date range, and manager scope into one backend filter tree.

## Expected Behavior

For Lead/Manager users, the `Review Focus` card count and the `/reviews` list now use equivalent backend filters. If the card says `5 items waiting`, opening reviews should show those same pending team review records unless the user applies additional filters.
