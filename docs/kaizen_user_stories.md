# Kaizen Management System - User Stories

**Application:** Kaizen_Prasun - Kaizen Management System  
**Platform:** Taruvi Cloud (Refine v5 + MUI)  
**Last Updated:** June 2026  
**Prepared For:** Business Analyst Review  

---

## Overview

The Kaizen Management System helps operations teams submit, review, audit, track, and close Kaizen improvement ideas. A Kaizen record represents an improvement opportunity with business context, routing, benefit metrics, review decisions, audit evidence, notifications, and certificates.

The application supports:
- role-based access
- employee Kaizen submission
- draft and resubmission flows
- Lead/Manager, OM/SOM, and PE/QA review queues
- configurable dropdowns, form fields, view fields, dashboards, and benefit formulas
- duplicate detection and related idea warnings
- comments and collaboration
- file attachments and evidence
- audit history and activity trails
- notification outbox
- report archive and CSV exports
- certificate generation, viewing, downloading, and regeneration
- high impact Kaizen nomination and analysis
- user role, hierarchy, RBAC, and Super Admin settings management

This document is written as a product-facing user story set. It describes intended user outcomes and testable acceptance criteria. It avoids locking the team into unnecessary UI or code-level implementation details unless they are part of the business requirement.

---

## Roles

| Role | Description |
|------|-------------|
| **Employee** | Creates Kaizen ideas, saves drafts, submits final ideas, edits drafts or returned ideas, views own Kaizens, comments, files, notifications, and certificates |
| **Lead / Manager** | Reviews team Kaizens, approves or rejects ideas, nominates high impact Kaizens, edits returned Kaizens for correction, and resubmits to the workflow |
| **OM / SOM** | Reviews Lead-approved Kaizens, approves or rejects, makes high impact nomination decisions, and monitors team/program progress |
| **PE / QA** | Reviews and audits approved Kaizens, validates benefits, closes Kaizens, generates certificates, or returns Kaizens for correction |
| **Executive View** | Views program dashboards, reports, analytics, leaderboards, global search, audit information, and business impact without submitting ideas |
| **Super Admin** | Manages settings, dropdown values, form fields, view fields, dashboard configuration, benefit calculations, certificate templates, user roles, hierarchy, and controlled Kaizen deletion |

---

## Product Rules

These rules apply across stories unless explicitly overridden:

- Kaizen IDs must be shown as human-readable values when available
- Draft records must not receive final Kaizen IDs until submitted
- A unique Kaizen should appear once in list views, using the latest workflow state
- Employee users can submit Kaizens
- OM/SOM and PE/QA users do not submit Kaizens
- Executive View users do not submit Kaizens
- Lead/Manager users can review assigned/team Kaizens according to hierarchy and reporting manager data
- Review buttons are enabled only while the Kaizen is in the correct stage for that role
- Rejection or correction reasons must meet the configured minimum character rule
- PE/QA can close and generate certificates, or return a Kaizen for correction
- PE/QA return-for-correction sends the Kaizen back to the Lead/Manager queue
- Notifications must be queued for relevant workflow participants and must not block the primary action
- Audit/activity records must capture tracked workflow changes
- File uploads must use approved Taruvi storage buckets
- Benefit calculations must use active configuration rows when available and safe defaults otherwise
- Certificates are available only after the Kaizen reaches an eligible completion/certificate state
- Super Admin destructive actions must require confirmation

### User Flow Chart: Role-Based Actions for Kaizens

| Role | Can Submit? | Can Review? | Can Audit? | Can Delete Kaizen? | Certificate Scope |
|------|-------------|-------------|------------|--------------------|-------------------|
| Employee | Yes | No | No | No | Own generated certificates |
| Lead / Manager | No | Yes, for assigned/team queue | No | No | Team certificates if enabled by scope |
| OM / SOM | No | Yes, OM/SOM queue | No | No | Team certificates |
| PE / QA | No | Yes, PE/QA audit queue | Yes | No | All Kaizen certificates |
| Executive View | No | No | No | No | Program visibility only where allowed |
| Super Admin | Admin controlled | Admin controlled | Admin controlled | Yes, from Settings only | All certificates and templates |

### Workflow Rules

- Employee saves draft or submits a Kaizen
- Submitted Kaizen enters Lead/Manager Review
- Lead/Manager can approve, reject, or nominate for High Impact
- Approved Lead/Manager Kaizen moves to OM/SOM Review
- OM/SOM can approve, reject, and decide pending High Impact nomination
- OM/SOM approved Kaizen moves to PE/QA Audit
- PE/QA can generate certificate and close the Kaizen
- PE/QA can return a Kaizen for correction
- Returned Kaizen appears in the Lead/Manager queue for correction and resubmission
- After resubmission, the approval flow starts again from Lead/Manager to OM/SOM to PE/QA

---

## US-01: Submit a Kaizen Idea

**Feature Name:** Kaizen Submission

**Target User:** Employee

**User Story:**  
As an Employee,  
I want to submit a structured Kaizen idea,  
So that an improvement opportunity can be reviewed and tracked through approval.

**Constraints:**
- Category and Effort Type must start blank and be selected by the user
- Required fields must be validated before draft save or final submit
- OM/SOM, PE/QA, Executive View, and Super Admin-only users must not see submission capability as a normal user flow

**Acceptance Criteria:**
- Employee can open the Kaizen create form from the Kaizen page
- The form captures title, problem statement, proposed solution, expected benefit, category, effort type, department, client, process, project members, and benefit inputs
- Category and Effort Type options load from Settings dropdown values, with safe fallback defaults when settings are unavailable
- Department and client choices load from master data
- Process choices load after department and client are selected
- Productivity Kaizens capture impacted volume and time saved
- Quality Kaizens capture error before, error after, and rework time
- Other Kaizens capture total time saved
- FTE saving is calculated from the active benefit configuration
- Duplicate detection runs when enough title/problem text is available
- Similar or duplicate ideas are shown before submission
- Strong duplicate matches require justification before final submit
- Attachments can be uploaded and associated with the Kaizen
- Team contribution lines can be entered when team members are involved
- Custom fields configured in Settings are shown and validated
- On final submit, a Kaizen ID is generated by the backend
- On success, an audit entry is recorded
- On success, workflow notifications are queued for the next reviewer
- No console errors occur during a successful submit flow

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_departments` datatable
- `kaizen_clients` datatable
- `kaizen_processes` datatable
- `kaizen_dropdown_options` datatable
- `kaizen_form_field_configs` datatable
- `kaizen_custom_field_values` datatable
- `kaizen_attachments` datatable
- `kaizen_duplicate_checks` datatable
- `kaizen-attachments` storage bucket
- `kaizen-submit-idea` function
- `kaizen-duplicate-detection` function
- `kaizen-team-contributions` function
- `kaizen-audit-log` function

**Impacted Areas:** Kaizen List, Review Queue, Notifications, Audit Logs, Attachments

---

## US-02: Save and Edit a Draft Kaizen

**Feature Name:** Draft Management

**Target User:** Employee

**User Story:**  
As an Employee,  
I want to save a Kaizen as draft and continue editing later,  
So that incomplete ideas can be prepared before formal submission.

**Constraints:**
- Draft save is available only to users who can submit Kaizens
- Draft records must remain editable by the submitter
- Draft records must not be routed to approval queues

**Acceptance Criteria:**
- Employee can save a new Kaizen as Draft
- Draft status is visible in the Kaizen list and detail page
- Draft retains entered form values after reload
- Draft can be reopened from the Kaizen list
- Draft can be submitted later as a final Kaizen
- Draft save creates or updates the Kaizen record without moving it to review
- Draft save records a draft audit event
- Save as Draft is not shown to Lead/Manager correction editors
- No console errors occur during draft save or edit

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen-audit-log` function

**Impacted Areas:** Kaizen Form, Kaizen List, Kaizen Detail, Audit Logs

---

## US-03: View Kaizen List

**Feature Name:** Kaizen List

**Target User:** Employee and PE/QA

**User Story:**  
As an authorized user,  
I want to view Kaizens in a searchable, filterable list,  
So that I can find relevant Kaizen records quickly.

**Constraints:**
- Employee users see their own Kaizens
- PE/QA users see submitted program Kaizens
- Duplicate status-history rows must not appear as separate Kaizens
- Create Kaizen action is shown only to roles that can submit

**Acceptance Criteria:**
- The Kaizen list supports server-side search
- Search can match Kaizen ID or title
- Status, category, and submitted date range filters are available
- Active filters are visible as removable chips
- Server-side pagination supports 10, 20, 50, and 100 rows
- Status values are displayed as chips
- Category values are displayed as category chips
- List columns can be driven by `kaizen_view_field_configs`
- FTE saving uses configured benefit calculation values
- Empty states distinguish no data, no results, no matching filters, and load errors
- Bulk action toolbar appears when rows are selected
- Bulk actions support approved operations such as export, status update, email, certificate regeneration, and attachment download
- Opening a row navigates to Kaizen detail
- Draft or rejected Kaizens can be edited only when allowed
- No duplicate rows are shown for the same Kaizen ID
- No console errors occur during common list interactions

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_view_field_configs` datatable
- `kaizen_benefit_calculation_configs` datatable
- `kaizen-bulk-operations` function

**Impacted Areas:** Kaizen Detail, Bulk Operations, Settings, Reports

---

## US-04: View Kaizen Detail

**Feature Name:** Kaizen Detail

**Target User:** Users with access to a Kaizen

**User Story:**  
As a user viewing a Kaizen,  
I want to see the full details, activity, files, reviews, notifications, and certificates,  
So that I understand the current state and supporting history.

**Constraints:**
- Users without record access must not be able to modify protected data
- Detail actions must respect role and workflow stage
- Raw internal IDs should be avoided when user-facing labels are available

**Acceptance Criteria:**
- Detail page opens from list, review queue, dashboard, report, or global search links
- Breadcrumb shows Kaizen navigation context
- Header shows title, status chip, submitted date, and owner
- Overview tab shows department, client, process, stage, high impact status, benefit metrics, and problem details
- Reviews tab shows review decisions, reviewer, role, comments, and high impact actions
- Comments tab supports adding comments
- Team tab shows project lead/member contribution details
- Duplicates tab shows duplicate detection results
- Activity tab shows audit log entries linked to the Kaizen
- Files tab shows downloadable attachments
- Notifications tab shows queued/sent notification rows
- Certificates tab shows view/download actions for generated certificates
- Impact tab shows impact calculations and evidence
- Edit/withdraw/audit actions appear only when permitted
- PE/QA audit action is available from detail when the Kaizen is in PE/QA Audit or approved state
- No console errors occur when loading or interacting with the detail page

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_reviews` datatable
- `kaizen_comments` datatable
- `kaizen_team_contributions` datatable
- `kaizen_duplicate_checks` datatable
- `kaizen_audit_logs` datatable
- `kaizen_attachments` datatable
- `kaizen_notifications` datatable
- `kaizen_certificates` datatable
- `kaizen_impact_calculations` datatable
- `kaizen_impact_evidence` datatable

**Impacted Areas:** Kaizen List, Review Queue, Audit Logs, Certificates, Notifications

---

## US-05: Review Kaizen as Lead / Manager

**Feature Name:** Lead/Manager Review

**Target User:** Lead / Manager

**User Story:**  
As a Lead or Manager,  
I want to review Kaizens submitted by my team,  
So that valid ideas can move forward and incomplete ideas can be returned.

**Constraints:**
- Lead/Manager queue must be scoped to assigned or reporting employees
- Review button is enabled only during Lead/Manager Review
- Rejection reason must meet the configured minimum character rule

**Acceptance Criteria:**
- Lead/Manager can open the Review Queue
- Queue shows Kaizen, status, department, submitted date, hours saved, and actions
- Search, status, department, employee username, and submitted date filters are available
- Lead/Manager can see assigned/team submitted Kaizens
- Lead/Manager can approve a Kaizen
- Lead/Manager can reject a Kaizen with rejection category and reason
- Lead/Manager can nominate a Kaizen for High Impact
- High Impact nomination requires a reason
- Review comments are required before saving a decision
- Hours saved and rework reduced values can be captured or adjusted during review
- After approval, the Kaizen moves to OM/SOM Review
- After rejection, the Kaizen status and reason are visible to relevant users
- Notifications are queued for submitter and next reviewer when applicable
- Review history is saved in `kaizen_reviews`
- No console errors occur during a successful Lead/Manager review

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_reviews` datatable
- `kaizen_hierarchy_assignments` datatable
- `kaizen_notifications` datatable
- `kaizen-review-idea` function

**Impacted Areas:** Review Queue, Kaizen Detail, Notifications, High Impact, Audit Logs

---

## US-06: Review Kaizen as OM / SOM

**Feature Name:** OM/SOM Review

**Target User:** OM / SOM

**User Story:**  
As an OM or SOM,  
I want to review Lead-approved Kaizens,  
So that operational leadership can approve, reject, or decide high impact nominations.

**Constraints:**
- OM/SOM review is available only while the Kaizen is in OM/SOM Review
- OM/SOM users must not submit new Kaizen ideas
- High Impact nomination decision is required before approval when a nomination is pending

**Acceptance Criteria:**
- OM/SOM can open the Review Queue
- Queue defaults to OM/SOM Review where applicable
- OM/SOM can see who submitted each Kaizen
- OM/SOM can approve a Kaizen
- OM/SOM can reject a Kaizen with rejection category and reason
- OM/SOM can approve or reject pending High Impact nominations
- Review comments are required
- After OM/SOM approval, the Kaizen moves to PE/QA Audit
- After OM/SOM rejection, the Kaizen is returned or marked according to workflow rules
- Notifications are queued for submitter, Lead/Manager, and PE/QA when applicable
- No console errors occur during a successful OM/SOM review

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_reviews` datatable
- `kaizen_notifications` datatable
- `kaizen-review-idea` function

**Impacted Areas:** Review Queue, OM/SOM Dashboard, Notifications, High Impact, Audit Logs

---

## US-07: Audit and Close Kaizen as PE / QA

**Feature Name:** PE/QA Benefit Audit

**Target User:** PE / QA

**User Story:**  
As a PE/QA reviewer,  
I want to audit Kaizen benefits and close completed Kaizens,  
So that validated improvements can be certified and included in program results.

**Constraints:**
- PE/QA users must not submit Kaizen ideas
- PE/QA audit is available only after OM/SOM approval or when the Kaizen is in PE/QA Audit
- The direct "Close Kaizen" option is not available; closure is tied to certificate generation or return for correction

**Acceptance Criteria:**
- PE/QA can access the review/audit queue
- PE/QA can filter by status, department, employee, and submitted date
- PE/QA can view hours saved for each queued Kaizen
- PE/QA can open the audit dialog from Review Queue or Kaizen Detail
- PE/QA can choose Close and Generate Certificate
- PE/QA can choose Return for Correction
- Audit comments are required
- Correction category is required when returning for correction
- Correction reason must meet the configured minimum character rule
- Hours saved and rework reduced values are captured or confirmed
- Certificate generation closes the Kaizen and creates certificate records/files
- Return for Correction sends the Kaizen back to the Lead/Manager queue
- Notifications are queued for the submitter, Lead/Manager, and OM/SOM on correction
- No console errors occur during a successful audit action

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_reviews` datatable
- `kaizen_certificates` datatable
- `kaizen_notifications` datatable
- `kaizen-review-idea` function
- `kaizen-cert-template-lite` function

**Impacted Areas:** Review Queue, Kaizen Detail, Certificates, Notifications, Reports

---

## US-08: Correct and Resubmit Returned Kaizen

**Feature Name:** Correction Resubmission

**Target User:** Lead / Manager

**User Story:**  
As a Lead or Manager,  
I want to edit a Kaizen returned by OM/SOM or PE/QA and resubmit it,  
So that corrections can re-enter the approval flow.

**Constraints:**
- Lead/Manager can edit only returned Kaizens assigned to them
- Draft Save is hidden during Lead correction edit
- Resubmitted Kaizens must restart the approval flow from Lead/Manager to OM/SOM to PE/QA

**Acceptance Criteria:**
- Returned Kaizens appear in the Lead/Manager queue
- Lead/Manager sees an Edit action for eligible returned Kaizens
- Edit form opens with existing Kaizen values
- The form title indicates correction editing
- Lead/Manager can update the needed fields
- Submit button is labeled Resubmit Kaizen
- Resubmission records the updated state
- Resubmission moves the Kaizen back into the review flow
- Rejection or correction reason remains visible in the detail page
- Notifications are queued for the next reviewer after resubmission
- No console errors occur during correction edit or resubmit

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_reviews` datatable
- `kaizen_notifications` datatable
- `kaizen-submit-idea` function
- `kaizen-review-idea` function

**Impacted Areas:** Review Queue, Kaizen Form, Kaizen Detail, Notifications

---

## US-09: Comments and Collaboration

**Feature Name:** Kaizen Comments

**Target User:** Users with access to a Kaizen

**User Story:**  
As a user collaborating on a Kaizen,  
I want to add comments and mentions,  
So that questions, clarifications, decisions, and risks are captured with the record.

**Constraints:**
- Empty comments must not be saved
- Comments must be associated with a specific Kaizen
- Mention notifications must not block comment save

**Acceptance Criteria:**
- Comments are available from the Kaizen detail page
- User can select a comment type such as General, Question, Clarification, Decision, or Risk
- User can enter a comment body
- Comment save is disabled when the comment body is blank
- Comment body can include @username mentions
- Successful comment save clears the comment input
- Comment thread refreshes after save
- Mentioned users receive notifications when supported by backend function behavior
- Comment failures show notification feedback without breaking the page
- No console errors occur while adding comments

**Dependencies:**
- `kaizen_comments` datatable
- `kaizen_notifications` datatable
- `kaizen-comment-action` function

**Impacted Areas:** Kaizen Detail, Notifications

---

## US-10: View Audit Logs and Activity Trail

**Feature Name:** Audit Logs

**Target User:** PE/QA, Executive View, Super Admin, and authorized reviewers

**User Story:**  
As an authorized reviewer or auditor,  
I want to search and inspect audit logs,  
So that I can see what changed, who changed it, and when it changed.

**Constraints:**
- Audit log search must not cause bad request errors
- Severity filter is not part of the approved audit log page experience
- Audit scope must support both My Logs and Team/All Logs where permitted

**Acceptance Criteria:**
- Audit Logs page loads immutable activity records
- User can search by Kaizen ID, action, user, or related text
- User can filter by From and To date
- User can switch between permitted scopes
- Audit entries show Kaizen ID, action, actor, timestamp, and source/context
- Clicking a log or Kaizen ID exposes change details including who, when, and what changed
- Activity tab on Kaizen detail shows logs tied to that Kaizen
- K1, K2, and K3 style records should appear according to actual activity, not duplicate or omit valid Kaizen IDs
- Empty and error states are shown clearly
- No console errors occur during audit log search, refresh, or detail inspection

**Dependencies:**
- `kaizen_audit_logs` datatable
- `kaizen-audit-log` function

**Impacted Areas:** Kaizen Detail, Review Queue, Compliance, Reports

---

## US-11: Notifications

**Feature Name:** Notification Outbox

**Target User:** Users involved in a Kaizen workflow

**User Story:**  
As a Kaizen participant,  
I want to receive workflow notifications,  
So that I know when a Kaizen needs my action or has changed status.

**Constraints:**
- Notification failures must not block the primary workflow action
- Notifications must be deduplicated where backend logic supports it
- Notification recipients depend on workflow stage and decision

**Acceptance Criteria:**
- Notification page lists notification records
- User can search notifications
- User can filter by notification type and status
- Status and type are visible in the list
- New Kaizen submission notifies Lead/Manager
- Lead approval notifies OM/SOM
- OM/SOM approval notifies PE/QA
- PE/QA return for correction notifies submitter, Lead/Manager, and OM/SOM
- Certificate generation notifies eligible recipients
- Role or profile changes can queue role-change notifications
- Notification settings allow user-level preferences where enabled
- Empty state explains when no notifications exist
- No console errors occur when loading or filtering notifications

**Dependencies:**
- `kaizen_notifications` datatable
- `kaizen_notification_preferences` datatable
- `kaizen-notification-preferences` function
- Workflow functions that queue notification rows

**Impacted Areas:** Submission, Review Queue, Audit, Certificates, User Roles

---

## US-12: View and Download Certificates

**Feature Name:** Certificates

**Target User:** Employee, OM/SOM, PE/QA, Super Admin

**User Story:**  
As a user with certificate access,  
I want to view and download generated Kaizen certificates,  
So that completed improvement work can be recognized and shared.

**Constraints:**
- Certificates are visible only after eligible Kaizen completion or certificate generation
- Employee scope is own certificates
- OM/SOM scope is team certificates
- PE/QA scope is all Kaizen certificates
- Certificate preview for template design must not be confused with user certificate access

**Acceptance Criteria:**
- Certificate page shows generated certificates
- User can select a certificate and preview it
- User can download a certificate file
- Certificate rows show certificate number, status, issued date, reward amount, and actions
- Certificate detail on Kaizen page also supports view/download
- Certificate file path resolves through approved Taruvi storage URL
- If no certificate is selected, the preview area shows a clear empty state
- If no certificates are available, the list shows a clear empty state
- No console errors occur when viewing or downloading certificates

**Dependencies:**
- `kaizen_certificates` datatable
- `kaizen_ideas` datatable
- `kaizen-attachments` storage bucket
- `kaizen-cert-template-lite` function

**Impacted Areas:** PE/QA Audit, Kaizen Detail, Settings, Reports

---

## US-13: Manage Certificate Templates and Regeneration

**Feature Name:** Certificate Settings

**Target User:** Super Admin

**User Story:**  
As a Super Admin,  
I want to manage certificate templates and regenerate certificates,  
So that certificate branding and generated files stay aligned with business requirements.

**Constraints:**
- Only Super Admin users can access certificate template settings
- Template JSON fields must be valid JSON
- Regeneration applies only to eligible completed Kaizens

**Acceptance Criteria:**
- Settings includes a Certificates tab
- Admin can edit template key, name, type, version, status, default flag, page size, orientation, background path, placeholders, and layout JSON
- Admin can upload a replacement certificate asset
- Admin can preview the selected template
- Admin can edit generated certificate metadata
- Admin can view and download existing generated certificate files
- Admin can search eligible Kaizens for regeneration
- Admin can select a certificate template for regeneration
- Admin can regenerate a certificate for an eligible Kaizen
- Regeneration updates or creates the generated certificate file and record
- Success and error feedback use the application notification provider
- No console errors occur during template save, preview, upload, or regeneration

**Dependencies:**
- `kaizen_certificate_templates` datatable
- `kaizen_certificates` datatable
- `kaizen_ideas` datatable
- `kaizen-attachments` storage bucket
- `kaizen-cert-template-lite` function

**Impacted Areas:** Settings, Certificates, Kaizen Detail, PE/QA Audit

---

## US-14: Generate Reports and View Report Archive

**Feature Name:** Reports

**Target User:** Executive View, PE/QA, Super Admin, and authorized reviewers

**User Story:**  
As an authorized program user,  
I want to generate and view Kaizen reports for a selected date range,  
So that program activity and Kaizen details can be exported and reviewed.

**Constraints:**
- Report date range must drive both generation and archive filtering
- Generated report format is CSV
- Report Archive should show Kaizen list view for the selected date range
- Department scorecard card is not part of the approved report page scope

**Acceptance Criteria:**
- Reporting Period card supports current month and custom date ranges
- Start and End dates can be selected
- Generate Report button generates a CSV report
- Generated report name uses Kaizen Report naming
- Generated report includes all relevant Kaizen details
- Report Archive filters by selected reporting period
- Report Archive shows Kaizens for the selected date range
- Report Archive does not show only completed Kaizens unless explicitly filtered
- Archive rows support CSV download actions where available
- Empty state is shown when no Kaizens exist for the selected period
- Function-not-found errors are not shown for archive listing
- No console errors occur during report generation or archive filtering

**Dependencies:**
- `kaizen_report_archives` datatable
- `kaizen_ideas` datatable
- `kaizen-generate-report` function

**Impacted Areas:** Reports, Global Search, Analytics

---

## US-15: Search All Kaizens

**Feature Name:** Global Kaizen Search

**Target User:** Executive View, PE/QA, Super Admin, and authorized reviewers

**User Story:**  
As an authorized user,  
I want to search all Kaizens without duplicate rows,  
So that I can inspect the latest state of each Kaizen.

**Constraints:**
- Each Kaizen ID appears only once
- Latest record is determined by the most recent update timestamp or version
- Search must not return HTTP 400 errors
- Status column remains visible

**Acceptance Criteria:**
- Global Search supports text search
- Date range, department, client, and category filters are available
- Status column remains in the results
- Duplicate K1/K2 draft and submitted rows are collapsed to one latest row
- Latest status is shown for each unique Kaizen ID
- Search for K1, K2, or K3 returns matching latest records where present
- User can open Kaizen detail from results
- User can export results to CSV
- Selected rows can be used for controlled bulk actions
- Empty states distinguish no results, no matches, and load errors
- No console errors occur during search, filter, export, or open detail

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_saved_views` datatable
- `kaizen-bulk-action` function

**Impacted Areas:** Kaizen Detail, Reports, Bulk Operations

---

## US-16: Review Executive and Role Dashboards

**Feature Name:** Dashboards

**Target User:** Employee, Lead/Manager, OM/SOM, PE/QA, Executive View

**User Story:**  
As a user with a Kaizen role,  
I want a dashboard tailored to my responsibility,  
So that I can quickly understand submissions, queues, completions, savings, and quality impact.

**Constraints:**
- Executive View dashboard must not show Kaizen submit actions
- Executive View dashboard must not show Review or Notification menu items
- Executive dashboard should emphasize completed Kaizens, hours saved, FTE saving, quality improvement, high impact Kaizens, and high impact savings
- Dashboard card labels and visibility may be controlled by Settings

**Acceptance Criteria:**
- Employee dashboard shows personal submission metrics and relevant certificates
- Lead/Manager dashboard shows team queue and team progress
- OM/SOM dashboard shows team/program queue and submitter information
- PE/QA dashboard shows all Kaizen information relevant to audit and closure
- Executive View dashboard shows stakeholder summary metrics
- Dashboard counts do not double-count duplicate draft/submitted records for the same Kaizen
- Executive dashboard card design highlights key numbers and business impact
- Process-level leaderboard appears in the dashboard area where configured
- User-level leaderboard appears as a separate card where configured
- Dashboard widgets respect `kaizen_dashboard_widget_configs`
- Hidden dashboard widgets are not shown
- No console errors occur during dashboard load

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_certificates` datatable
- `kaizen_sla_snapshots` datatable
- `kaizen_dashboard_widget_configs` datatable
- `kaizen-analytics-summary` function

**Impacted Areas:** Home, Team Dashboard, OM/SOM Dashboard, Settings, Leaderboard

---

## US-17: View Leaderboards, Analytics, and Scorecards

**Feature Name:** Program Analytics

**Target User:** Executive View, PE/QA, Super Admin, and authorized reviewers

**User Story:**  
As an authorized program user,  
I want to see leaderboards and analytics,  
So that I can understand participation, closure, savings, and improvement impact.

**Constraints:**
- Leaderboard counts must use unique latest Kaizens
- Kaizen count must not include duplicate status-history rows
- Metrics must be calculated from live data or approved analytics functions

**Acceptance Criteria:**
- Analytics page displays program summary data
- Leaderboard shows user-level performance
- Process-level leaderboard is available where configured
- User-level leaderboard is separated into its own card
- Total Kaizens count reflects unique Kaizen submissions
- Closed/completed Kaizen count reflects actual completion state
- Impact score and savings are calculated consistently
- Scorecards and productivity reports can be viewed by authorized users
- CSV/report exports are available where supported
- No console errors occur during analytics or leaderboard load

**Dependencies:**
- `kaizen_ideas` datatable
- `kaizen_report_archives` datatable
- `kaizen_impact_calculations` datatable
- `kaizen-analytics-summary` function
- `kaizen-generate-report` function

**Impacted Areas:** Dashboards, Reports, Global Search

---

## US-18: Manage High Impact Kaizens

**Feature Name:** High Impact Kaizen

**Target User:** Lead/Manager, OM/SOM, Executive View, PE/QA, Super Admin

**User Story:**  
As a program reviewer,  
I want to nominate and analyze high impact Kaizens,  
So that the organization can recognize high-value improvements.

**Constraints:**
- Lead/Manager can nominate during review
- OM/SOM decides pending high impact nominations
- High Impact reason is required when nominated

**Acceptance Criteria:**
- Lead/Manager can nominate a Kaizen for High Impact during review
- Nomination reason is required
- OM/SOM can approve or reject a pending high impact nomination
- High Impact status and reason are visible on Kaizen detail
- High Impact analysis page lists analyses and associated items
- Authorized users can run high impact analysis
- Executive dashboard includes high impact Kaizen count and high impact saving
- No console errors occur during nomination, decision, or analysis

**Dependencies:**
- `kaizen_high_impact_analyses` datatable
- `kaizen_high_impact_analysis_items` datatable
- `kaizen_ideas` datatable
- `kaizen-review-idea` function
- `kaizen-high-impact-analysis` function

**Impacted Areas:** Review Queue, Kaizen Detail, Dashboards, Analytics

---

## US-19: Manage Settings as Super Admin

**Feature Name:** Super Admin Settings

**Target User:** Super Admin

**User Story:**  
As a Super Admin,  
I want to configure Kaizen dropdowns, fields, views, benefit formulas, dashboards, certificates, and controlled deletion,  
So that the application can evolve without code changes for every business configuration update.

**Constraints:**
- Settings is visible only to Super Admin users
- Non-admin users must be blocked from direct Settings access
- Kaizen deletion is allowed only from Settings
- Destructive actions must require confirmation

**Acceptance Criteria:**
- Settings menu is visible only to Super Admin
- Settings page includes tabs for Dropdown Values, Form Fields, View Fields, Benefit Calculation, Dashboard Pages, Certificates, and Delete Kaizen
- Admin can add and delete supported dropdown values
- Character limit feedback is shown for dropdown fields that have length limits
- Admin can configure form fields and custom fields
- Visible custom fields render on the Kaizen form
- Required custom fields are validated before save/submit
- Admin can configure Kaizen list/detail view fields
- Admin can edit benefit calculation formulas, denominator, multiplier, helper text, sort order, and active state
- Admin can configure dashboard widgets by role
- Admin can manage certificate templates and generated certificate metadata
- Admin can delete Kaizens only after confirmation
- Success and error feedback use the application notification provider
- No console errors occur during settings maintenance

**Dependencies:**
- `kaizen_dropdown_options` datatable
- `kaizen_form_field_configs` datatable
- `kaizen_custom_field_values` datatable
- `kaizen_view_field_configs` datatable
- `kaizen_benefit_calculation_configs` datatable
- `kaizen_dashboard_widget_configs` datatable
- `kaizen_certificate_templates` datatable
- `kaizen_certificates` datatable
- `kaizen_ideas` datatable
- `kaizen-cert-template-lite` function

**Impacted Areas:** Entire Application

---

## US-20: Manage Users, Roles, Hierarchy, and RBAC

**Feature Name:** User and Access Administration

**Target User:** Super Admin

**User Story:**  
As a Super Admin,  
I want to manage users, role assignments, hierarchy, and RBAC checks,  
So that access and routing stay aligned with the operating model.

**Constraints:**
- Platform users and roles must be managed through Taruvi user and role APIs, not custom auth tables
- Role changes must be audited
- Hierarchy drives Lead/Manager visibility

**Acceptance Criteria:**
- Admin Users page lists platform users
- Admin can update a user's Kaizen role/profile attributes through the approved function
- Admin can bulk update user roles from CSV rows
- Role changes create audit rows
- Hierarchy page supports reporting-line assignments
- Hierarchy report can be generated
- RBAC Matrix page shows role/action permissions
- Admin can update RBAC rules where supported
- Admin can test a user's permissions
- Sidebar navigation respects role visibility
- Logout action works from the top profile/avatar menu
- No console errors occur during role, hierarchy, or RBAC workflows

**Dependencies:**
- Taruvi platform user provider
- `kaizen_role_change_audits` datatable
- `kaizen_hierarchy_assignments` datatable
- `kaizen_hierarchy_change_logs` datatable
- `kaizen_rbac_permissions` datatable
- `kaizen_rbac_roles` datatable
- `kaizen-update-user-role` function
- `kaizen-hierarchy-management` function
- `kaizen-rbac-matrix` function

**Impacted Areas:** Review Queue, Sidebar, Settings, Audit Logs

---

## US-21: Manage Master Data and Taxonomy

**Feature Name:** Master Data and Taxonomy

**Target User:** Super Admin and authorized operations users

**User Story:**  
As an authorized operations user,  
I want to manage departments, clients, processes, and taxonomy,  
So that Kaizen routing and categorization options stay accurate.

**Constraints:**
- Active master data should drive form dropdowns
- Inactive or unavailable master data must not break the form
- Taxonomy updates must be saved through approved backend actions

**Acceptance Criteria:**
- Master Data page supports approved master data actions
- Departments, clients, and processes are available to the Kaizen form
- Process dropdown is filtered by selected department and client
- Taxonomy page lists taxonomy entries
- Admin can save, deactivate, suggest, and analyze taxonomy entries where supported
- Taxonomy suggestions can be generated from text
- Trending tags/analytics can be viewed where supported
- Empty and error states are shown clearly
- No console errors occur during master data or taxonomy management

**Dependencies:**
- `kaizen_departments` datatable
- `kaizen_clients` datatable
- `kaizen_processes` datatable
- `kaizen_taxonomy` datatable
- `kaizen-master-data-action` function
- `kaizen-taxonomy-action` function

**Impacted Areas:** Kaizen Form, Kaizen List Filters, Settings

---

## US-22: Manage Withdrawals, SLA, Reminders, and Bulk Operations

**Feature Name:** Workflow Operations

**Target User:** Employee, reviewers, PE/QA, Super Admin, and authorized operations users

**User Story:**  
As a workflow participant or operations owner,  
I want supporting workflow operations for withdrawals, SLA tracking, reminders, and bulk work,  
So that Kaizens can be governed efficiently after submission.

**Constraints:**
- Withdrawal must require explicit confirmation
- Admin reactivation must require justification
- Bulk operations must show the affected scope
- Reminder and SLA jobs must not block normal page usage

**Acceptance Criteria:**
- Eligible submitters can withdraw a Kaizen from detail page
- Withdrawal captures reason, comments, and approver consent where required
- Withdrawal creates auditable workflow state
- Withdrawals page allows authorized reactivation with justification
- SLA Tracking page can run/persist SLA snapshots
- SLA status and aging information are visible where available
- Reminders page can run reminder generation and reminder actions
- Bulk Operations page can run supported bulk operations and download result CSV
- Bulk operation history is visible
- No console errors occur during withdrawal, reactivation, SLA, reminder, or bulk flows

**Dependencies:**
- `kaizen_withdrawals` datatable
- `kaizen_sla_configs` datatable
- `kaizen_sla_snapshots` datatable
- `kaizen_reminders` datatable
- `kaizen_reminder_settings` datatable
- `kaizen_bulk_operations` datatable
- `kaizen-withdrawal-action` function
- `kaizen-sla-tracking` function
- `kaizen-run-reminders` function
- `kaizen-reminder-action` function
- `kaizen-bulk-operations` function

**Impacted Areas:** Kaizen Detail, Review Queue, Notifications, Reports

---

## US-23: Manage Incentives and Rewards

**Feature Name:** Incentives and RO Rewards

**Target User:** Super Admin, Executive View, and authorized operations users

**User Story:**  
As an authorized rewards user,  
I want to configure incentive rules and generate incentive batches,  
So that Kaizen rewards are calculated and tracked consistently.

**Constraints:**
- Incentive rules must validate before save
- Reward generation should be auditable and exportable
- Reward values must use approved formulas and period filters

**Acceptance Criteria:**
- Incentive Rules page can preview, save, import, export, and reset incentive formulas
- Incentives page can generate incentive batches for a selected period
- Incentive batch rows can be approved or rejected where supported
- RO Rewards page shows reward dashboard data
- RO reward actions can be executed from the rewards page
- Reward exports are downloadable where supported
- Errors are shown through application notifications
- No console errors occur during incentive or reward workflows

**Dependencies:**
- `kaizen_incentive_formula_configs` datatable
- `kaizen_incentive_batches` datatable
- `kaizen_incentive_items` datatable
- `kaizen_ro_incentives` datatable
- `kaizen_ro_reward_configs` datatable
- `kaizen-incentive-rules` function
- `kaizen-incentive-batch` function
- `kaizen-ro-rewards` function

**Impacted Areas:** Analytics, Reports, Certificates, Dashboards

---

## US-24: Manage Evidence and Impact Calculations

**Feature Name:** Impact Evidence and Calculations

**Target User:** PE/QA and authorized operations users

**User Story:**  
As a PE/QA or operations user,  
I want to register evidence and calculate Kaizen impact,  
So that benefit claims can be validated before closure and reporting.

**Constraints:**
- Evidence must be associated with a Kaizen
- Verification status and quality score must be controlled values
- Calculations must use approved backend logic

**Acceptance Criteria:**
- Impact Calculations page can compute impact values
- Evidence Repository page can register evidence metadata
- Evidence can be verified with verification status and quality score
- Kaizen detail Impact tab shows calculations and evidence linked to the Kaizen
- PE/QA review captures hours saved and rework reduced percentage
- Calculated metrics feed dashboards, reports, and certificates where applicable
- No console errors occur during impact calculation or evidence verification

**Dependencies:**
- `kaizen_impact_calculations` datatable
- `kaizen_impact_evidence` datatable
- `kaizen_ideas` datatable
- `kaizen-impact-calculation` function
- `kaizen-evidence-action` function

**Impacted Areas:** PE/QA Audit, Kaizen Detail, Reports, Dashboards

---

## US-25: Maintain Governance Tools

**Feature Name:** Governance Tools

**Target User:** Super Admin and authorized governance users

**User Story:**  
As a governance user,  
I want tools for duplicate checks, email templates, newsletters, system health, and presentations,  
So that the Kaizen program can be monitored and communicated effectively.

**Constraints:**
- Hidden menu items must not be visible when removed from approved navigation
- Governance actions must show success/error feedback
- Generated exports must be downloadable where supported

**Acceptance Criteria:**
- Duplicate Management page lists duplicate checks and can trigger duplicate detection
- Email Templates page can preview, save, reset, and test templates
- Newsletter generation can create and update newsletter records where enabled
- System Health page can snapshot, export, and resolve alerts
- Comparative Analysis page can generate or save comparison views
- Innovation Presentations page can generate, list, and download presentation exports
- Dashboard Widgets page can save and reset widget layouts
- Error states and empty states are handled consistently
- No console errors occur during governance operations

**Dependencies:**
- `kaizen_duplicate_checks` datatable
- `kaizen_email_templates` datatable
- `kaizen_newsletters` datatable
- `kaizen_system_health_snapshots` datatable
- `kaizen_system_alerts` datatable
- `kaizen_comparison_views` datatable
- `kaizen_presentation_exports` datatable
- `kaizen_dashboard_widget_layouts` datatable
- `kaizen-duplicate-detection` function
- `kaizen-email-template-action` function
- `kaizen-newsletter-generate` function
- `kaizen-system-health` function
- `kaizen-comparative-analysis` function
- `kaizen-presentation-export` function
- `kaizen-dashboard-widgets` function

**Impacted Areas:** Governance, Operations, Dashboards, Reports

---

## Definition of Ready

A story is ready when:
- the user, business outcome, and scope are clear
- acceptance criteria are testable
- dependencies are known
- permission assumptions are explicit where relevant
- workflow stage assumptions are explicit where relevant
- error and edge cases are considered
- unresolved product questions are captured separately

---

## Definition of Done

A story is done when:
- acceptance criteria are met
- build or type-check passes
- no critical browser-console issues remain in the covered flow
- access-control behavior matches approved role rules
- audit and notification behavior match approved workflow scope
- list and dashboard counts avoid duplicate Kaizen records
- generated reports and certificates use approved names, formats, and scopes
- the implemented behavior matches the final agreed user story, not an outdated draft
