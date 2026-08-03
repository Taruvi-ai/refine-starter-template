# Kaizen App Implementation Spec

## Scope

Implement the first ten Kaizen user stories as a production-ready Refine v5 + Taruvi app. Identity stays on Taruvi platform users/roles; the app adds Kaizen domain datatables, storage, functions, and Refine pages for submission, review, history, related ideas, notifications, dashboards, certificates, and role administration.

## Backend Resources

- `kaizen_departments`: department code/name, manager routing, business unit.
- `kaizen_clients`: client master data for submissions.
- `kaizen_ideas`: draft/submitted Kaizens, generated `KZN/<year>/<department>/<sequence>` IDs, workflow status/stage, impact metrics, rewards, certificate path, submitter snapshots, and team metadata.
- `kaizen_attachments`: attachment metadata linked to ideas and the `kaizen-attachments` storage bucket.
- `kaizen_reviews`: manager/OM/SOM/PE-QA decisions, rejection reasons, comments, and impact updates.
- `kaizen_notifications`: deduplicated notification outbox with branded HTML/text body, recipient, status, and direct portal link.
- `kaizen_role_change_audits`: audit trail for user role/profile changes.
- `kaizen_certificates`: generated certificate records and download paths.

## Functions

- `kaizen-submit-idea`: validates mandatory fields, generates Kaizen ID only on final submit, creates/updates the idea, and queues submission notifications.
- `kaizen-review-idea`: enforces rejection category and 20-character reason, updates workflow status/stage and impact metrics, creates review/audit rows, queues status-change notifications, and creates certificate records when requested.
- `kaizen-update-user-role`: assigns platform roles, updates platform user attributes, deactivates/reactivates users, supports bulk CSV rows, writes role-change audit rows, and queues role-change notifications.

## Frontend Map

- `/`: personalized dashboard with live user metrics, certificates, rewards, trends, and role-specific queues.
- `/kaizens`: "My Submissions" list with server-side search, filters, pagination, status chips, and four empty states.
- `/kaizens/create`: structured submission form with draft save, attachments, team fields, and related/similar idea warnings.
- `/kaizens/edit/:id`: draft/resubmission editing.
- `/kaizens/show/:id`: detail page with breadcrumb, status, meta line, tabs, attachments, reviews, notifications, certificate data, and rejection reason/resubmit actions.
- `/reviews`: manager/OM/SOM/PE-QA review workbench with approve/reject/impact/audit/certificate actions.
- `/admin/users`: role/profile management using the Taruvi `user` provider plus the role-update function and CSV bulk assignment.
- `/notifications`: notification outbox/history.

## Auth And Access

- Login/register use Taruvi redirect-based auth and SSO-compatible backend flows.
- User profile fields are stored in platform `user.attributes`, validated by the tenant attribute schema.
- UI actions are role-aware; admin/review pages deny access gracefully for users without the relevant platform roles.

## Verification

- Provision schema, roles, storage, functions, and seeded records through Taruvi MCP.
- Execute the functions with seeded data to confirm response shapes.
- Type-check the frontend with `tsc --noEmit` without starting the already-running dev server.

## July 2026 Workflow Audit Fix

- `kaizen-submit-idea` must create an immutable `kaizen_audit_logs` entry when an employee submits or resubmits an idea.
- The submission audit entry must include the initial idea, dependency, and category-specific impact fields so Activity Logs show what the employee entered before reviewer changes.
- Existing Lead/Manager, OM/SOM, and PE/QA stage transitions, benefit calculations, notifications, and certificate generation must remain unchanged.
- Regression verification covers submission, all review stages, calculation persistence, chronological audit entries, notification routing, certificate generation, and cleanup of test records.

## Remaining Story Completion Notes

- US-5: Similar idea cards in the submission form now include a direct `View details` action.
- US-6: Review queue filters include status, department, employee username, and submitted date range; review comments are required in both the UI and `kaizen-review-idea`.
- US-9: Dashboard certificate rows include download actions when a certificate path exists.
- US-10: Admin user management now includes a live role-change audit history from `kaizen_role_change_audits`.
