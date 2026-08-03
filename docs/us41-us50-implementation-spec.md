# US41-US50 Implementation Spec

## Scope

Build the next Kaizen administration and analytics layer:

- US41: Department, client, and process master data management with hierarchy, archive/deactivate, import/export, audit, and usage analytics.
- US42: Employee withdrawal/cancellation flow with allowed status validation, reason capture, notifications, audit, admin reactivation, and withdrawal reporting.
- US43: SLA configuration, stage aging analysis, breach escalation, aging buckets, trend metrics, and export.
- US44: Certificate template customization with versions, branding layout JSON, preview/test generation, import/export, and defaults per certificate type.
- US45: Bulk operations on Kaizens with selection, status/tag/email/assignment/certificate actions, confirmation, progress summary, partial failures, and operation history.
- US46: User notification preferences, quiet hours, mute windows, digest frequencies, test notification, and notification-center actions.
- US47: Advanced impact calculations with formula breakdown, expected vs actual variance, evidence requirements, and PE/QA validation.
- US48: Comparative analysis and benchmarking across departments, clients, categories, and time periods with saved templates and export.
- US49: Evidence repository for impact validation evidence, verification workflow, quality scoring, download metadata, and missing evidence reporting.
- US50: Custom dashboard widget layouts with widget library, role-aware defaults, drag/drop ordering, size controls, reset, template sharing, and export.

## Backend Resources

New datatables:

- `kaizen_processes`
- `kaizen_withdrawals`
- `kaizen_sla_configs`
- `kaizen_sla_snapshots`
- `kaizen_certificate_templates`
- `kaizen_bulk_operations`
- `kaizen_notification_preferences`
- `kaizen_impact_calculations`
- `kaizen_impact_evidence`
- `kaizen_comparison_views`
- `kaizen_dashboard_widget_layouts`

Safe updates to existing tables:

- `kaizen_departments`: add head, status, parent hierarchy fields.
- `kaizen_clients`: add location and primary contact fields.
- `kaizen_ideas`: add `Withdrawn` status plus process/SLA/withdrawal/advanced impact summary fields.
- `kaizen_notifications`: add workflow notification types for withdrawal, SLA, bulk operation, preferences, evidence, benchmarking, and dashboard updates.

Serverless functions:

- `kaizen-master-data-action`
- `kaizen-withdrawal-action`
- `kaizen-sla-tracking`
- `kaizen-certificate-template-action`
- `kaizen-bulk-operations`
- `kaizen-notification-preferences`
- `kaizen-impact-calculation`
- `kaizen-comparative-analysis`
- `kaizen-evidence-repository-action`
- `kaizen-dashboard-widgets`

## Frontend

New pages:

- `/master-data`
- `/withdrawals`
- `/sla-tracking`
- `/certificate-templates`
- `/bulk-operations`
- `/notification-settings`
- `/impact-calculations`
- `/comparative-analysis`
- `/evidence-repository`
- `/dashboard-widgets`

Embedded changes:

- Kaizen form: process dropdown cascades by selected department/client.
- Kaizen list: checkbox selection and bulk actions toolbar.
- Kaizen detail: withdraw action, SLA status in overview, impact/evidence tab, and withdrawal warning.
- Home dashboard: customization entry point and widget layout persistence.
- Notifications page: preference/settings entry point and read/unread/delete actions.

## Verification

- Use MCP `create_update_schema` with preserved existing fields for updated tables.
- Smoke-test each serverless function with realistic params.
- Run `node_modules\\.bin\\tsc.cmd --noEmit`.
- Do not run `npm run dev` or `npm run build`.
