# Audit Log Team Scope

## Goal

Audit Logs should not show every user's activity to ordinary users. The page should show activity relevant to the current user's role.

## Behavior

- Employee users are locked to "My Kaizen logs".
- "My Kaizen logs" includes audit rows linked to Kaizen ideas submitted by the employee, using `kaizen_ideas.submitted_by_username` to collect the employee's idea IDs and Kaizen IDs.
- Lead/Manager and higher-privileged roles open on "All logs" so testing, compliance review, and management roles see the complete available audit trail.
- Lead/Manager users can also switch between "My logs" and "Team logs" where those scoped views are useful.
- "My logs" for non-employees only includes rows where `user_username` equals the current user.
- "Team logs" includes rows where `user_username` is a submitter reporting to the current manager.
- "All logs" has no user filter; date and search filters still apply.

## Implementation Notes

- The page keeps the audit query scoped to an impossible record until identity data is available, preventing an unrestricted first render.
- Team members are derived from `kaizen_ideas.submitted_by_username` where `reporting_manager_username` equals the logged-in manager.
- Current-user matching allows the identity username, email, email local-part, and equivalent identity attributes because audit rows store username-style values.
- Audit-log filtering is applied server-side through Taruvi Database filters.
- The current `datatable:kaizen_audit_logs` Cerbos policy is still broad at the resource level. True direct-API row enforcement would require a backend policy/function change because `kaizen_audit_logs` does not store an owner/submitter field directly on each audit row.
