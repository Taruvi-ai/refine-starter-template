# Team Dashboard Recent Ideas Status Filter Spec

## Request

The Team Dashboard `Recent Team Ideas` table should not show Kaizens in `Draft` or `Withdrawn` status.

## Implementation

- Added a dashboard-specific excluded-status list for `Draft` and `Withdrawn`.
- Added a server-side `status__nin` filter to the `Recent Team Ideas` query.
- Kept the existing team ownership scope, sorting, and pagination unchanged.

## Files

- `src/pages/team-dashboard/index.tsx`
