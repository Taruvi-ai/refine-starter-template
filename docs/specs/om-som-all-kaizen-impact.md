# OM/SOM All-Kaizen Impact

## Objective

Make the OM/SOM Review Impact card summarize all submitted Kaizens rather than only the current OM/SOM queue.

## Aggregation

- Total Hours Saved: sum of explicit or category-derived saved hours.
- Total FTE Saving: sum of explicit or configured category-derived FTE savings.
- Avg Rework Reduced: arithmetic mean across Quality Kaizens with a valid positive reduction.
- Draft records are excluded.

## Affected file

- `src/pages/om-som-dashboard/index.tsx`

## Verification

- Current two submitted Kaizens produce 727.17 total saved hours and 4.54 total FTE saving.
- Quality rework reduction uses the stored value when present and derives it from before/after errors otherwise.
- TypeScript validation passes.
