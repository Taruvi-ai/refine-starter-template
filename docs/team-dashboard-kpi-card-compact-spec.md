# Team Dashboard KPI Card Compact Spec

## Request

The Team Dashboard KPI cards were too large and visually sparse on desktop. Make them smaller and cleaner while keeping the same live metrics.

## Implementation

- Kept the existing KPI data sources and counts unchanged.
- Reduced KPI card padding, icon size, and minimum height.
- Moved the label beside the icon so it no longer sits far away in the top-right corner.
- Changed the KPI grid to use five compact columns on large screens, three on medium screens, two on small screens, and one on mobile.

## Files

- `src/pages/team-dashboard/index.tsx`
