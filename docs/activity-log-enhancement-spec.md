# Activity Log Enhancement

## Objective

Provide a field-level, immutable audit trail on each Kaizen detail page and the governance Activity Logs page. Every displayed change must identify the date/time, actor, role, section, field, previous value, and new value in chronological order.

## Existing architecture

- Kaizen records live in `kaizen_ideas`.
- Immutable activity records live in `kaizen_audit_logs` with actor, timestamp, action/source, and JSON `old_value` / `new_value` snapshots.
- The Kaizen detail page reads audit records directly through the Taruvi database provider.
- Draft/submission and review transitions are performed through the Kaizen form and server-side workflow functions.

## Design

1. Preserve `kaizen_audit_logs` as the audit source of truth.
2. Store matching old/new field snapshots for each update operation.
3. Flatten each audit snapshot into one visible row per changed field.
4. Map technical field keys to user-facing sections and labels in one shared frontend definition.
5. Keep action-only events visible as `Activity / Action` rows so the trail remains complete.
6. Sort by timestamp ascending so the record reads as a chronological history.
7. Show the authenticated user's display name when captured, with username as a fallback.

## Scope

- Idea Details, Classification, Organization, Ownership, Workflow, Impact, Review, High Impact, Certificate, and System metadata fields.
- Impact includes monthly impacted volume, time saved, FTE saved, hours/cost saved, before/after error counts, rework time/reduction, total time saved, advanced impact score, validation status, and evidence status.
- Draft save, submission, Lead/Manager review, OM/SOM review, PE/QA review, withdrawal/reactivation, and impact changes represented by existing workflow audit entries.
- Existing historical records remain readable; no destructive migration or backfill is required.

## Impact and role-based coverage

- Impact fields include monthly impacted volume, time saved, FTE saved, hours/cost saved, before and after error counts, rework time and reduction, total time saved, advanced impact score, validation status, and evidence status.
- Lead/Manager and OM/SOM benefit changes are captured before calculated values are persisted.
- Lead/Manager, OM/SOM, and PE/QA workflow decisions capture all changed Kaizen fields with the authenticated username.
- Advanced impact save, submit, and verification operations create immutable before/after audit entries.
- The governance Audit Log dialog combines the full Kaizen history so Impact changes remain visible even when a newer non-Impact event is the latest event.

## Verification

- TypeScript compilation succeeds.
- Existing action-only audit entries still render.
- Multi-field changes render as multiple rows with identical actor/time but distinct field details.
- Null, boolean, array, and object values render safely.
