# PE/QA Submit Access

## Requirement

PE/QA users should review and audit Kaizens only. They should not create, save drafts, submit, edit drafts, or resubmit Kaizen ideas.

## Rule

- `canSubmitKaizen` is true for Admin and regular Employee users.
- `canSubmitKaizen` is false for PE/QA and OM/SOM role users unless they are Admin.
- PE/QA keeps access to All Kaizens, Reviews, audit views, and certificate/audit workflows.
- Direct `/kaizens/create` and `/kaizens/edit/:id` route access is blocked by the Kaizen form.

## Affected Files

- `src/pages/kaizens/shared.tsx`
- `src/pages/kaizens/list.tsx`
- `src/pages/kaizens/form.tsx`
- `src/pages/home/index.tsx`
- `src/components/sidenav/MuiSidenav.tsx`
