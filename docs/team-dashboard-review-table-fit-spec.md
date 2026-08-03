# Team Dashboard Review Table Fit

## Request

Adjust the Team Dashboard "Needs Your Review" table so the columns fit in the card and do not require horizontal scrolling.

## Scope

- Update Team Dashboard table layout only.
- Keep current columns and row actions.
- Apply the same compact layout to the Recent Team Ideas table because it uses the same row component and column set.

## Implementation

- Remove the row-level minimum width that forces overflow.
- Use fixed table layout with explicit column widths.
- Truncate long Kaizen titles and submitter lines.
- Prevent date, FTE, and action cells from expanding the table.
- Tighten action button padding.
