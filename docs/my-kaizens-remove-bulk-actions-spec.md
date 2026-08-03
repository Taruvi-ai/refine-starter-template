# My Kaizens Bulk Action Removal

## Request

Remove the bulk action option from the My Kaizens page because bulk actions are not required there.

## Scope

- Hide row selection checkboxes on the employee-facing My Kaizens list.
- Hide the bulk action toolbar and confirmation dialog trigger on My Kaizens.
- Keep existing bulk actions available on the PE/QA All Kaizens list where program-level operations may still be used.

## Affected Files

- `src/pages/kaizens/list.tsx`

## Verification

- TypeScript check should pass.
- My Kaizens should not show selection checkboxes, selected count, Bulk Action dropdown, Apply, or Clear controls.
- All Kaizens should retain its existing bulk action behavior.
