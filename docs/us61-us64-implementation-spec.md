# US61-US64 Implementation Spec

## Scope

- US61: Reporting Officer role and reward management, including RO assignment, reward formulas, incentive calculation, dashboards, incentive sheet export, audit, and notifications.
- US62: Span of control and hierarchy management, including employee-position hierarchy, matrix/temporary assignments, validation, import/export, visibility/routing metadata, and span reporting.
- US63: RBAC matrix management, including predefined/custom roles, feature permissions, templates, inheritance, audit, compliance checks, and permission test summaries.
- US64: Innovation Day presentation export, including presentation templates, generation parameters, generated-slide metadata, download/archive status, scheduling metadata, usage analytics, and audit.

## Backend Resources

New datatables:

- `kaizen_ro_reward_configs`
- `kaizen_ro_assignments`
- `kaizen_ro_incentives`
- `kaizen_hierarchy_positions`
- `kaizen_hierarchy_assignments`
- `kaizen_hierarchy_change_logs`
- `kaizen_rbac_roles`
- `kaizen_rbac_permissions`
- `kaizen_rbac_templates`
- `kaizen_rbac_audits`
- `kaizen_presentation_templates`
- `kaizen_presentation_exports`

Safe updates to existing tables:

- `kaizen_ideas`: add RO summary fields for reporting/routing.
- `kaizen_incentive_batches`: add RO incentive totals and export status.

Serverless functions:

- `kaizen-ro-rewards`
- `kaizen-hierarchy-management`
- `kaizen-rbac-matrix`
- `kaizen-presentation-export`

## Frontend

New pages:

- `/ro-rewards`
- `/hierarchy`
- `/rbac-matrix`
- `/innovation-presentations`

Embedded changes:

- App resource registration and routes.
- User/role admin workflows remain on platform user provider; no custom auth/user tables are introduced.
- Presentation export downloads generated PPTX-compatible payloads and tracks usage in the export archive.

## Verification

- Provision schemas with additive changes only.
- Smoke-test each serverless function with realistic, non-destructive params.
- Run `node_modules\\.bin\\tsc.cmd --noEmit`.
- Do not run `npm run dev` or `npm run build`.
