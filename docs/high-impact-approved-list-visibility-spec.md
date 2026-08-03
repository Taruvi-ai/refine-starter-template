# High Impact Approved List Visibility

## Issue

Approved High Impact Kaizens were not appearing on the High Impact Kaizen page.

## Cause

The page only displayed rows from `kaizen_high_impact_analysis_items`, which are created by the separate Generate action. OM/SOM approval updates the source Kaizen row with `high_impact_nomination_status = "Approved"`, so an approved Kaizen could be valid but still absent from the generated analysis-items table.

The page also defaulted to `Q2`, which could hide recently approved records when the current date is in another quarter.

## Implementation

- Default the quarter selector to the current quarter.
- Query approved High Impact Kaizens directly from `kaizen_ideas`.
- Merge approved Kaizens into the Ranked Kaizens list when they are not already present in generated analysis items.
- Keep the Generate action available for ranked analysis output, but approval now makes the Kaizen visible without waiting for generated analysis rows.

## Files

- `src/pages/governance/index.tsx`
