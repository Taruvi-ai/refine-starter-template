# Kaizen Status Consistency Spec

## Issue

A draft row can show two different signals in My Kaizens:

- The title subtitle shows `Draft` when `kaizen_id` is missing.
- The status chip shows the raw `status` value.

One affected row had `status = Submitted`, `current_stage = Submitted`, `is_draft = true`, no `kaizen_id`, and no `submitted_at`. That is not a valid submitted Kaizen because submitted Kaizens must be created through the submit workflow, which generates the Kaizen ID and submission timestamp.

## Expected Behavior

- Draft rows remain Draft until submitted through the Kaizen form.
- Bulk status updates cannot turn an incomplete draft into a submitted workflow record.
- List rows should not use `Draft` as a generic placeholder when the row is missing a Kaizen ID for another reason.

## Implementation

- Display `No Kaizen ID` for non-draft rows missing a Kaizen ID.
- Keep draft rows labeled `Draft`.
- Block bulk status updates to non-draft statuses unless the row already has a Kaizen ID and submission date.
- Repair the single inconsistent row back to Draft because it is missing mandatory submission metadata.
