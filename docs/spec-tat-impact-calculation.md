# TAT Impact Calculation

## Inputs

- TAT Before (minutes)
- TAT After (minutes)
- TAT Improvement (%) is derived and read-only

TAT Before and TAT After are required. TAT Before must be greater than zero, and TAT After must not exceed TAT Before.

## Derived values

- TAT Improvement (%) = ((TAT Before - TAT After) / TAT Before) x 100

The derived percentage is read-only. Employees provide inputs during submission; Lead/Manager and OM/SOM may update the inputs during review. Every input and derived-value change is included in the Kaizen audit snapshots. TAT no longer contributes Monthly Time Saved, Hours Saved, or FTE Savings.

## Affected areas

- `kaizen_ideas` storage
- Employee Kaizen form
- Lead/Manager and OM/SOM review
- Kaizen Overview and Activity Log
- Submit and review serverless calculation functions
