# Review Benefit Calculation Lead/OM Spec

## Request

Lead/Manager and OM/SOM reviewers should not directly edit final impact values. They should edit the source benefit inputs and see calculated values using the same configured calculation logic as employee submission.

## Implementation

- Lead/Manager and OM/SOM review dialogs now show category-specific source inputs:
  - Productivity: impacted volume and time saved.
  - Quality: before error count and after error count.
  - Other: time saved.
- `FTE Saved` and `Rework Reduction (%)` are read-only calculated fields for Lead/Manager and OM/SOM.
- FTE calculation uses `calculateConfiguredFteSaving` and `useBenefitCalculationConfigs`, matching the employee submission page.
- Added `kaizen-review-benefits`, a Taruvi wrapper function that persists recalculated source inputs, FTE saved, hours saved, and rework reduction before executing the standard review workflow.
- PE/QA audit fields keep the existing direct audit behavior.

## Files

- `src/pages/reviews/index.tsx`
