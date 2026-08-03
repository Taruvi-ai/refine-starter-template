# Leaderboard Kaizen Count

## Issue

The leaderboard counted every `kaizen_ideas` row for an employee. Save-as-draft creates draft rows, and later submission can create the submitted Kaizen row, so the count included both draft remnants and submitted Kaizens.

## Rule

Leaderboard `Kaizens` means submitted Kaizen records only.

- Exclude rows with status `Draft`.
- Exclude rows without a generated `kaizen_id`.
- Deduplicate portfolio entries by `kaizen_id`.
- Closed count is calculated from the same submitted-only portfolio list.

For the Appbuild test user, this changes K1/K2/K3 from 5 displayed rows to 3 submitted Kaizens.
