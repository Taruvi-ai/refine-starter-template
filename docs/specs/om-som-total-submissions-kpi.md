# OM/SOM Total Submissions KPI

## Objective

Add a Total Kaizens Submitted card to the OM/SOM dashboard.

## Data source

- Reuse the all-submitted Kaizen query that powers the Kaizen Impact card.
- Exclude drafts using the existing submitted-impact filters.
- Use the backend-provided `result.total`, not the loaded page length.

## Layout

- Add the KPI as the first card.
- Expand the extra-large desktop KPI grid from five to six equal columns.
- Preserve responsive one- and two-column layouts at smaller widths.

## Affected file

- `src/pages/om-som-dashboard/index.tsx`

## Verification

- The current data displays `2` total submitted Kaizens.
- No additional backend query is introduced.
- TypeScript validation passes.
