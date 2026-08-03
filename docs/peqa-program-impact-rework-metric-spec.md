# PE/QA Program Impact Rework Metric

## Request

QA users should see Avg Rework Reduced in the Program Impact card.

## Implementation

- The Home dashboard already calculates `averageQualityImprovement` from Quality Kaizens with `rework_reduced_percent`.
- The Program Impact card now renders `Avg Rework Reduced` for PE/QA program dashboard users.
- The value displays as a percentage and falls back to `0%` when no qualifying Quality Kaizens have rework reduction.

## Files

- `src/pages/home/index.tsx`
