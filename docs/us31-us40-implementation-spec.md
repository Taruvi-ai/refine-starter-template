# US31-US40 Implementation Spec

## Scope

Build the governance and administration layer for the Kaizen app:

- US31: incentive formula/rule configuration with versioning, effective dates, import/export, validation, and preview calculation.
- US32: quarterly high-impact Kaizen analysis with ranking, selection for award, export, notifications, and archive.
- US33: Kaizen comments and threaded collaboration on the detail page.
- US34: immutable audit/activity log with search, filters, export, lifecycle timeline, compliance report, and alert records.
- US35: duplicate Kaizen detection with configurable thresholds, flagged duplicate records, related links, merge/mark actions, and prevention reporting.
- US36: team member contribution tracking, lead/member split, member acceptance, certificate/incentive inputs, and leaderboard contribution data.
- US37: category, subcategory, and tag management with status, department defaults, formula mapping, suggestions, analytics, and bulk assignment support.
- US38: email template management with placeholders, preview/test, version history, enable/disable, reset defaults, CC/BCC, and audit trail.
- US39: monthly newsletter generation with sections, HTML/Markdown/printable output, publish workflow, archive, download tracking, and notifications.
- US40: system health/performance dashboard with metrics, alerts, job status, maintenance/cache/session controls, and export.

## Backend Resources

New datatables:

- `kaizen_incentive_formula_configs`
- `kaizen_high_impact_analyses`
- `kaizen_high_impact_analysis_items`
- `kaizen_comments`
- `kaizen_audit_logs`
- `kaizen_duplicate_checks`
- `kaizen_team_contributions`
- `kaizen_taxonomy`
- `kaizen_idea_tags`
- `kaizen_email_templates`
- `kaizen_newsletters`
- `kaizen_system_health_snapshots`
- `kaizen_system_alerts`

Safe updates to existing tables:

- `kaizen_ideas`: add duplicate/team/tags metadata fields without removing existing fields.
- `kaizen_notifications`: add `Comment`, `Duplicate`, `Award`, `Newsletter`, `System Alert`, and `Email Test` notification types.

Serverless functions:

- `kaizen-incentive-rules`: validate, save, preview, export, and import incentive formula configs.
- `kaizen-high-impact-analysis`: generate quarterly ranking, select award recommendations, queue notifications, and archive report rows.
- `kaizen-comment-action`: add/edit/delete/moderate comments and queue mention notifications.
- `kaizen-audit-log`: append immutable audit entries and generate compliance summaries.
- `kaizen-duplicate-detection`: calculate duplicate candidates, create check records, link/merge/mark decisions.
- `kaizen-team-contributions`: upsert member contributions and calculate distribution.
- `kaizen-taxonomy-action`: create/update/deactivate taxonomy entries, suggest tags, and bulk assign tags.
- `kaizen-email-template-action`: save templates, preview placeholders, reset defaults, and queue test email notifications.
- `kaizen-newsletter-generate`: generate monthly newsletter archive in HTML, Markdown, printable HTML, and email notification rows.
- `kaizen-system-health`: compute dashboard metrics, log snapshots, create alerts, and record admin controls.

## Frontend

New pages:

- `/incentive-rules`
- `/high-impact-analysis`
- `/audit-logs`
- `/duplicates`
- `/taxonomy`
- `/email-templates`
- `/newsletters`
- `/system-health`

Embedded pages:

- Kaizen create/edit: stronger duplicate detection warning and team contribution entry.
- Kaizen show: comments tab, duplicate/team tabs, comment count, and lifecycle timeline from audit logs.

## Verification

- Run Taruvi function smoke tests for the new functions using non-destructive preview/generate paths.
- Run `node_modules\.bin\tsc.cmd --noEmit`.
- Do not run `npm run dev` or `npm run build`.
