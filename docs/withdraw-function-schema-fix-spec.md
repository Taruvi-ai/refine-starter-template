# Withdrawal Function Schema Fix

## Issue

Withdrawal failed after consent was checked because the backend schema did not allow values used by the withdrawal flow.

## Cause

- `kaizen-withdrawal-action` updates `kaizen_ideas.status` to `Withdrawn`, but `kaizen_ideas.status` did not include `Withdrawn` in its enum.
- The withdraw dialog offered reason values like `Duplicate`, but `kaizen_withdrawals.reason` did not allow all of those values.

## Changes

- Updated `kaizen_ideas.status` schema enum to match the app's Kaizen status list, including `Withdrawn`.
- Updated `kaizen_withdrawals.reason` schema enum to include all withdrawal reason options used by the app.
- Updated the stale physical PostgreSQL check constraints in `appbuild`, `apptest`, and `quality_assurance` schemas:
  - `kaizen_prasun_kaizen_ideas.status`
  - `kaizen_prasun_kaizen_ideas.current_stage`
  - `kaizen_prasun_kaizen_withdrawals.reason`
- Aligned the withdraw dialog reason options with the backend enum.

## Verification

- Re-read schemas after update.
- Re-read physical PostgreSQL check constraints after update.
- TypeScript check should pass.
- `kaizen-withdrawal-action` should no longer fail on valid consent and reason values.
