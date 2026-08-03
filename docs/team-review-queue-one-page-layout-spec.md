# Team Review Queue One Page Layout

## Request

The Team Review Queue table should fit in one page without the Actions column being clipped.

## Scope

- Update only the Review Queue page table layout.
- Keep existing review filters, workflow, dialogs, and actions.
- Keep all current columns visible.

## Implementation

- Use a wider page container for the review queue.
- Reduce card/table padding.
- Use a fixed table layout with explicit column widths.
- Keep long Kaizen titles truncated with tooltip support.
- Keep date, numeric, and action cells from wrapping.
- Format hours saved with separators so large values scan better.
