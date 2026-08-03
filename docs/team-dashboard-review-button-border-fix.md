# Team Dashboard Review Button Border Fix

## Request

The `Review` button in the Team Dashboard `Needs Your Review` table was clipped on the right side, making the border look incomplete.

## Implementation

- Increased the table actions column width.
- Reduced adjacent column widths to keep the table within the existing card.
- Added a stable minimum width and slightly stronger outline for the row action button.
- Allowed the action cell content to render visibly inside its column.

## Files

- `src/pages/team-dashboard/index.tsx`
