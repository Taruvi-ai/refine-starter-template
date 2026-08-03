# Activity Impact Audit Fix

## Problem

The Kaizen Activity Log UI can render Impact changes, but the persisted audit rows do not contain the full Impact snapshot. Existing submission rows omit `impacted_volume` and `time_saved`, Lead/OM review changes are not present, and actor name/role metadata is null.

## Affected flow

- Employee draft save, submission, correction, and resubmission
- Lead/Manager benefit review
- OM/SOM benefit review, including FTE cost overrides
- Kaizen detail Activity Log tab

## Required result

Every saved change must record the Kaizen ID, actor name, actor role, timestamp, source, and complete previous/new values. Impact fields must include monthly impacted volume, time saved, FTE saved, before/after errors, rework values, hours saved, FTE cost, and cost saved. The Activity Log derives one chronological row per changed field from those snapshots.

## Verification

- Employee submission creates Impact rows attributed to Employee.
- Lead review changes create separate Impact rows attributed to Lead/Manager.
- OM review changes create separate Impact rows attributed to OM/SOM.
- TypeScript validation passes and the Activity Log continues to render old audit records safely.
