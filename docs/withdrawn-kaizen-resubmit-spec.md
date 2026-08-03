# Withdrawn Kaizen Edit And Resubmit

## Request

When an employee withdraws a Kaizen, they should be able to edit and resubmit it.

## Behavior

- Employee-owned withdrawn Kaizens show an edit/resubmit action in My Kaizens.
- The Kaizen detail page shows a Resubmit action for withdrawn employee-owned Kaizens.
- The edit form accepts employee-owned withdrawn Kaizens.
- Submitting the form uses the existing `kaizen-submit-idea` function, which updates the existing idea back into the Lead/Manager review flow.

## Affected Files

- `src/pages/kaizens/shared.tsx`
- `src/pages/kaizens/list.tsx`
- `src/pages/kaizens/show.tsx`
- `src/pages/kaizens/form.tsx`
