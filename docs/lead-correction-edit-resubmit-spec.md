# Lead Correction Edit And Resubmit

## Goal

Lead/Manager users can correct Kaizens returned or rejected by downstream reviewers and resubmit them into the approval flow.

## Behavior

- Lead/Manager can edit a Kaizen when:
  - the Kaizen status is `Rejected` or `Resubmitted`
  - the logged-in lead matches `reporting_manager_username` or `team_lead_username`
- Lead/Manager sees an `Edit Correction` action in the Review Queue and Kaizen detail page.
- The edit form opens for the assigned lead only for correction records.
- Lead/Manager cannot create new Kaizens or save correction edits as employee drafts.
- Resubmitting keeps the original employee submitter fields and sends the Kaizen back into the existing approval flow.

## Affected Files

- `src/pages/kaizens/shared.tsx`
- `src/pages/kaizens/form.tsx`
- `src/pages/kaizens/show.tsx`
- `src/pages/reviews/index.tsx`
