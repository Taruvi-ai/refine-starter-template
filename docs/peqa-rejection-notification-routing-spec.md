# PE/QA Rejection Notification Routing

## Requirement

When PE/QA rejects a Kaizen during benefit audit, notifications must be sent to:

- the Kaizen submitter / employee
- the submitter's lead / reporting manager
- the submitter's OM

The Kaizen must not remain closed after a PE/QA rejection. It must return to the Lead/Manager queue for correction, then continue through the normal Lead/Manager -> OM/SOM -> PE/QA flow after it is approved again.

## Implementation

The `kaizen-review-idea` Taruvi function now treats PE/QA `Rejected` as a correction return when:

- `decision` is `Rejected`
- the reviewer role is `PE/QA`, or the Kaizen is currently in `PE/QA Audit`

For this path, the function sets the Kaizen to:

- `status`: `Resubmitted`
- `current_stage`: `Lead/Manager Review`
- `responsible_username`: the reporting manager / team lead
- `resubmitted_at`, `rejected_at`, `stage_started_at`: current timestamp

It clears the summary Lead/Manager and OM/SOM comments so the same approval flow can be performed again, while preserving the PE/QA correction reason in `pe_qa_comments` and `rejection_reason`.

Lead resolution uses the Kaizen's `reporting_manager_*` fields first, then `team_lead_*` fields. OM resolution uses the lead user's `manager_*` attributes.

## Behavior

Notification rows are queued in `kaizen_notifications` with type `Rejection`; delivery remains handled by the existing notification outbox workflow.

The Review Queue's Lead/Manager default `Submitted` filter includes both `Submitted` and `Resubmitted` records when the stage is `Lead/Manager Review`, so returned Kaizens appear in the lead queue without needing a separate filter.
