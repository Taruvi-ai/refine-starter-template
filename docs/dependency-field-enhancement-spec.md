# Dependency Field Enhancement

## Objective

Add a controlled Dependency value to every Kaizen and carry it through employee submission, Lead/Manager review, OM/SOM review, detail display, and the immutable activity trail.

## Data contract

- Field: `dependency`
- Allowed values: `No`, `Client`, `Other Department`
- Stored on `kaizen_ideas`.
- Nullable at database level for compatibility with historical records and drafts.
- Required by both frontend and server-side validation for final submission.

## Workflow

1. Employees select Dependency in Idea Details. Drafts may be saved without it; final submission may not.
2. Lead/Manager and OM/SOM review dialogs initialize from the saved value and may update it.
3. Review functions persist the reviewer-selected value in the same atomic Kaizen update as the decision.
4. Existing field-level review auditing records the previous and updated Dependency values with actor, role, and timestamp.
5. The Overview tab displays the current value, and Activity Logs maps it to `Idea Details / Dependency`.

## Verification

- Schema contains the enum field without altering existing fields.
- Submission rejects a missing or unsupported value server-side.
- Review rejects an unsupported value and persists a supported change.
- TypeScript compilation succeeds.
