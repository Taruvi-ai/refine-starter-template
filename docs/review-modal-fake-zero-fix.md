# Review Modal Fake Zero Fix

## Problem

The Review Kaizen modal showed `0` in Hours Saved, Cost Saved, Rework Reduced %, and Reward Amount before the reviewer entered anything.

Those fields are review-stage metrics. They were being written as `0` during submission/review defaults, so the modal correctly displayed the stored value but the stored value was misleading.

## Fix

- `src/pages/reviews/index.tsx` now opens review metric fields as blank when values are missing.
- The review decision dropdown is limited to Approved and Rejected for this Lead/Manager review modal.
- The review modal only asks for Hours Saved and Rework Reduced %. Cost Saved and Reward Amount were removed from this review step.
- Hours Saved is prefilled from submitted impact inputs when possible:
  - Productivity: `Impacted Month Volume * Time Saved / 60`
  - Quality: `(Error Before - Error After) * Rework Time / 60`
  - Other: `Total Time Saved / 60`
- Rework Reduced % is prefilled for Quality Kaizens from `(Error Before - Error After) / Error Before * 100`.
- `kaizen-submit-idea` no longer defaults review-stage metric fields to zero.
- `kaizen-review-idea` no longer converts blank metric inputs to zero on save.
- Cleared fake zero values from `KZN/2026/CI/002` (`TEST123`) so it opens with blank metric fields.

Explicitly entered `0` values are still preserved as real zeros.
