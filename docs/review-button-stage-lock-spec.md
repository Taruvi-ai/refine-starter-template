# Review Button Stage Lock

## Rule

The Review action is enabled only while the Kaizen is at the current user's active review stage.

## Stage Mapping

- Lead/Manager can review while `current_stage = "Lead/Manager Review"` and status is `Submitted` or `Resubmitted`.
- OM/SOM can review while `current_stage = "OM/SOM Review"` and status is `In Review`.
- PE/QA can review while `current_stage = "PE/QA Audit"` or status is `Approved`.
- Admin can open active, non-closed workflow items.

After a reviewer approves/rejects and the Kaizen moves to the next stage, that reviewer should only view the record, not modify it again.

## Affected File

- `src/pages/reviews/index.tsx`
