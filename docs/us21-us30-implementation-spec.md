# US21-US30 Implementation Spec

## Source

`support_documents/1-10us.md` lines 360-612 define User Stories 21-30.

## Scope

Extend the Kaizen Refine v5 + Taruvi app with program analytics, leaderboard, reports, department scorecards, global search, PE/QA audit queue, training resources, automated reminders, bulk incentives, and employee productivity exports.

## Backend Additions

- `kaizen_saved_views`: user-saved search/filter/column presets for global search and audit views.
- `kaizen_training_resources`: searchable help/resource repository metadata with versioning and view/download counters.
- `kaizen_reminder_settings`: configurable reminder trigger schedule.
- `kaizen_reminders`: reminder history, active/snoozed states, escalation and direct links.
- `kaizen_report_archives`: generated monthly, scorecard, analytics, and productivity report archives with CSV and printable HTML.
- `kaizen_incentive_batches`: monthly incentive approval header and audit state.
- `kaizen_incentive_items`: per-employee incentive rows, anomalies, comments, and approval status.

## Backend Functions

- `kaizen-analytics-summary`: aggregates Kaizen KPIs, status/category/client/department distributions, trends, leaderboard, scorecards, audit pipeline, and comparison period metrics.
- `kaizen-generate-report`: generates and archives CSV plus printable branded HTML for monthly, department, productivity, analytics, and incentive reports.
- `kaizen-run-reminders`: evaluates reminder rules, creates reminder rows, queues reminder notifications, and supports dry-run preview.
- `kaizen-reminder-action`: snoozes or resolves reminder rows and updates timestamps.
- `kaizen-incentive-batch`: generates monthly incentive batches, approves/rejects/sends back rows or entire sheets, writes audit fields, and queues approval notifications.
- `kaizen-bulk-action`: applies approved bulk actions to filtered/selected Kaizens from global search or PE/QA audit views.

## Frontend Map

- `/analytics`: US21 admin/steering committee analytics dashboard with filters, KPI cards, charts, comparison, drill-down links, refresh, CSV and printable report export.
- `/leaderboard`: US22 top performer leaderboard with period toggles, department filter, top-three badges, and employee portfolio dialog.
- `/reports`: US23 monthly report generator and archive with CSV and printable HTML export.
- `/scorecards`: US24 department scorecard with filters, KPI tables/charts, benchmarking, export.
- `/search`: US25 global Kaizen search with advanced filters, saved views, column customization, export, result count, and controlled bulk approval.
- `/audit`: US26 PE/QA all-Kaizens audit workbench with audit status filters, threshold, aging, pending-my-action, bulk processing, export, and pipeline widgets.
- `/resources`: US27 training/resource repository with searchable categories, downloads, admin upload/update, version metadata, and view tracking.
- `/reminders`: US28 reminder dashboard with active reminders, settings, run preview, snooze/resolve, and reminder history.
- `/incentives`: US29 bulk incentive approval sheet with monthly generation, approve/reject/send-back actions, anomaly flags, exports, notifications, and approver timestamp.
- `/productivity`: US30 employee productivity report generator with benchmarking, CSV/printable export, and report archive.

## Verification

- Re-read Taruvi schema and functions after provisioning.
- Execute new functions with non-destructive preview/generate calls.
- Type-check frontend with `node_modules\.bin\tsc.cmd --noEmit`.
- Do not start or build the dev server.
