# Development Resume Spec

## Current Scope

Resume the Kaizen app implementation for the first ten user stories in `support_documents/1-10us.md`. The existing app is a Refine v5 + MUI + Taruvi frontend backed by provisioned Taruvi datatables, storage, roles, and app functions.

## Taruvi Resources

- Datatables: `kaizen_departments`, `kaizen_clients`, `kaizen_ideas`, `kaizen_attachments`, `kaizen_reviews`, `kaizen_notifications`, `kaizen_role_change_audits`, `kaizen_certificates`.
- Storage: private `kaizen-attachments` bucket.
- Functions: `kaizen-submit-idea`, `kaizen-review-idea`, `kaizen-update-user-role`.
- Roles: Employee, Lead/Manager, OM/SOM, PE/QA, Admin, Super Admin.
- Seed data exists for departments, clients, submitted/draft/rejected/certified ideas, notifications, and one certificate.

## Frontend Providers And Auth

- `src/providers/refineProviders.ts` wires Taruvi `data`, `storage`, `app`, `user`, `auth`, and `accessControl` providers.
- `src/App.tsx` registers Refine resources for Kaizens, Reviews, Notifications, and User Roles.
- Login remains redirect-based via `LoginRedirect`; user identity comes from the Taruvi auth/user providers.
- Platform users and roles are managed through the `user` provider and `kaizen-update-user-role`, not through custom auth datatables.

## Dependencies And Verification

- `node_modules` was initially absent. A normal `npm install` currently fails at the esbuild postinstall binary check, and a script-disabled install timed out after partially completing.
- `tsc --noEmit` can run, but its baseline is polluted by incomplete package/type declarations in `node_modules`.
- Source-level TypeScript issues identified during baseline:
  - `usePermissions` requires an options object with the installed Refine v5 type surface.
  - `icontains` is supported by Taruvi docs but not by the installed Refine `CrudOperators` type.

## Affected Files For This Slice

- `src/pages/kaizens/shared.tsx`: fix `usePermissions` call.
- `src/pages/kaizens/form.tsx`: type the related-ideas filters with supported Refine operators and stable query inputs.
- `src/pages/home/index.tsx`: stabilize dashboard query arguments.
- `src/pages/notifications/index.tsx`: scope notification history to the current user for non-admin users.

