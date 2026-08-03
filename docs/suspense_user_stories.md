# Suspense Record Management — User Stories

**Application:** RBS Form — Suspense Record Management System
**Platform:** Taruvi Cloud (Refine v5 + MUI)
**Last Updated:** May 2026
**Prepared For:** Business Analyst Review

---

## Overview

The Suspense Record Management System helps insurance operations teams create, track, update, and resolve suspense records. A suspense record represents work that cannot move forward until information is clarified, reviewed, or completed.

The application supports:
- role-based access
- configurable lookup data
- audit history
- comments and collaboration
- file attachments
- screen recordings
- email notifications
- per-user filter preferences

This document is written as a product-facing user story set. It describes intended user outcomes and testable acceptance criteria. It avoids locking the team into unnecessary UI or code-level implementation details unless they are part of the business requirement.

---

## Roles

| Role | Description |
|------|-------------|
| **Analyst / Processor** | Creates and updates suspense records as part of day-to-day processing work |
| **Subject Matter Expert (SME)** | Reviews more complex records and performs higher-trust updates |
| **Lead / Manager** | Oversees records, assignments, and operational progress |
| **Client** | Participates on records relevant to them and can provide updates or feedback |
| **Super Admin** | Manages application configuration, lookup data, and protected admin-only areas |

---

## Product Rules

These rules apply across stories unless explicitly overridden:

- Lookup IDs must always be shown to users as human-readable names
- Permissions must be enforced consistently through the app
- Audit history must be recorded for tracked changes
- File uploads must be stored in approved Taruvi storage buckets
- Screen recordings must be stored as approved record attachments
- Notifications must not block the primary save flow
- User preferences must be scoped per user and persist across sessions

### User Flow Chart: Role-Based Actions for Suspense Records

| Role | Can Create? | Can Edit? | Save & Alert Available? | Can Assign To (Create/Edit) |
|------|-------------|-----------|------------------------|-----------------------------|
| Analyst / Processor | Yes (with create permission) | Yes | ❌ No | Only SME |
| SME | Yes | Yes | ✅ Yes | Analyst or Lead |
| Lead / Manager | Yes | Yes | ✅ Yes | Any role (Analyst, SME, Lead, Client) |
| Client | Yes | Yes | ✅ Yes | Analyst, SME, Lead (not other Clients) |


### Assignment Rules
- Analyst → SME only – Analysts cannot assign work to Leads, Clients, or other Analysts.
- SME → Analyst or Lead – SMEs can assign work back to Analysts or escalate to Leads.
- Lead → all roles – Leads have full distribution authority.
- Client → Analyst, SME, Lead – Clients can reassign to internal teams but not to other Clients.
---

## US-01: Create a Suspense Record

**Feature Name:** Suspense Record Creation

**Target User:** Authorized authenticated users

**User Story:**  
As an authorized user,  
I want to create a suspense record using a structured form,  
So that pending work can be tracked consistently and routed to the correct person.

**Constraints:**
- Required fields must be validated before save
- Error Type must only be shown when Error is set to Yes
- Error Type must not be stored when Error is set to No

**Acceptance Criteria:**
- A user can open the create form from the main Suspense Records screen
- The form captures the required business fields for a suspense record
- Lookup-driven fields are populated from managed lookup tables
- Description supports rich text entry
- Description supports inline image upload
- Attachments can be uploaded and associated with the record
- Screen recordings can be uploaded and associated with the record as supporting evidence
- Error is captured as a Yes/No toggle
- Error Type is shown only when Error is Yes
- Error Type is required when shown
- Due Date is automatically set to start date + 1 day when Start Date is entered (if Due Date is not already set or is earlier)
- Assigned To options are restricted according to the current user’s role rules
- On successful save, the record is created and the user is returned to the main records view
- On successful save, a creation audit entry is recorded
- On successful save, a notification email is triggered when applicable
- Unsaved changes warning is shown if the user attempts to leave with modified form data
- No console errors occur during a successful create flow

**Dependencies:**
- Lookup datatables available and populated
- `suspense-attachments` storage bucket provisioned
- `audit_logs` datatable available
- `email-send` function deployed

**Impacted Areas:** List View, Audit History, Notifications

---

## US-02: View Suspense Records List

**Feature Name:** Suspense Records List

**Target User:** All authenticated users with read access

**User Story:**  
As a user with access to suspense records,  
I want to view records in a searchable, filterable list,  
So that I can quickly find the work relevant to me.

**Constraints:**
- Raw lookup IDs must not be shown in the list
- The list must refresh correctly after create, edit, or delete actions
- The list must not expose bulk-selection UI if bulk actions are not part of the approved experience

**Acceptance Criteria:**
- The suspense records list is the primary landing screen after login
- Records are shown in a grid with client-side pagination (all records loaded at once)
- The default visible columns support common operational review
- Additional supported columns can be shown through column visibility controls
- Status and Priority are visually distinguishable
- Search is available from the list toolbar
- Advanced filtering is available from the list toolbar
- Applied filters are visually visible to the user
- Filter state is saved per user and restored on reload
- The list shows action controls appropriate to the user’s permissions
- The list does not show summary widgets or bulk selection controls unless explicitly approved as part of the product scope
- Records can be grouped by status using collapsible group headers
- A record can be previewed inline from the list in sidebar, modal, or fullscreen view
- The selected preview mode is saved per user and restored on reload
- No console errors occur on load or common list interactions

**Dependencies:**
- Lookup datatables available
- `user_preferences` datatable provisioned
- Access-control policies configured

**Impacted Areas:** Detail View, Create, Edit, Filtering

---

## US-03: View Suspense Record Detail

**Feature Name:** Suspense Record Detail

**Target User:** All authenticated users with record access

**User Story:**  
As a user viewing a suspense record,  
I want to see the full details of the record and its history,  
So that I can understand its current state and what has changed over time.

**Constraints:**
- Raw lookup IDs must not be shown
- The detail experience must preserve context so the user can return to the list easily

**Acceptance Criteria:**
- A user can open a record detail view from the list
- The detail view shows the full business information for the record
- Rich-text description content is rendered correctly
- Attachments are listed and downloadable
- Screen recordings are listed with the record and can be opened or downloaded
- Activity history is available within the detail experience
- Error and Error Type are shown only when relevant
- The detail view exposes edit capability only when permitted
- No console errors occur when opening or using the detail view

**Dependencies:**
- Lookup datatables available
- Attachments retrievable from storage
- Screen recordings retrievable from storage

**Impacted Areas:** List View, Edit, Activity Feed

---

## US-04: Edit a Suspense Record

**Feature Name:** Suspense Record Edit

**Target User:** Authorized users with update permission

**User Story:**  
As an authorized user,  
I want to edit a suspense record,  
So that I can keep its status, assignment, and supporting details up to date.

**Constraints:**
- Users without update permission must not be able to edit
- Only supported schema fields may be submitted on save

**Acceptance Criteria:**
- A permitted user can open the edit form from the list or detail view
- The form is pre-populated with the current record data
- Assigned To shows the current saved assignee even if that user falls outside the normally assignable role filter
- The edit form follows the same business rules as the create form (including Due Date auto-set from Start Date)
- Existing attachments and screen recordings remain associated with the record unless removed by a permitted user
- Only changed supported values are submitted
- A tracked audit entry is created for each changed field
- If nothing changed, the system handles the save gracefully without misleading field-change history
- Save & Alert is available to SME, Lead, and Client roles only (not Analyst)
- Save & Alert triggers the extra alert notification flow
- A standard save triggers the normal update notification flow when applicable
- No console errors occur during a successful edit flow

**Dependencies:**
- Update permission configured
- `audit_logs` datatable available
- `email-send` function deployed

**Impacted Areas:** List View, Detail View, Audit History, Notifications

---

## US-05: Delete a Suspense Record

**Feature Name:** Suspense Record Deletion

**Target User:** Authorized users with delete permission

**User Story:**  
As an authorized user,  
I want to delete a suspense record,  
So that invalid or unwanted records can be removed from the system.

**Constraints:**
- Users without delete permission must not be able to delete
- Delete must require explicit confirmation

**Acceptance Criteria:**
- Delete is shown only to users with delete permission
- The user is asked to confirm before deletion proceeds
- On success, the record is removed from the list
- The UI refreshes correctly after deletion
- No console errors occur during a successful delete flow

**Dependencies:**
- Delete permission configured

**Impacted Areas:** List View

---

## US-06: Activity Feed — Comments and Audit History

**Feature Name:** Activity Feed

**Target User:** Users with access to the record

**User Story:**  
As a user reviewing a suspense record,  
I want to see comments and audit history in one place,  
So that I can understand both collaboration and system-tracked changes.

**Constraints:**
- Empty comments must not be allowed
- Comment authors can edit their own comments after posting
- Audit history must be read-only from the user’s perspective

**Acceptance Criteria:**
- The activity feed is accessible from the record detail experience
- Comments and audit entries appear in chronological order
- Users can post rich-text comments
- Inline images in comments are supported
- Mentioning active users is supported
- Mentioned users receive an email notification immediately after the comment is posted (fire-and-forget, one email per mentioned user)
- Rendered comment content remains readable and responsive
- A comment author can edit their own comment after posting
- Audit entries clearly show who changed what and the before/after values for tracked fields
- Status, Priority, and Error-related audit values are visually distinguishable
- Description changes expose a View Diff action
- No console errors occur while loading or posting activity content

**Dependencies:**
- `suspense_comments` datatable available
- `audit_logs` datatable available
- `comment-attachments` storage bucket provisioned
- Active user list available

**Impacted Areas:** Detail View

---

## US-07: Description Diff Viewer

**Feature Name:** Description Diff Viewer

**Target User:** Users with access to record activity history

**User Story:**  
As a user reviewing a description change,  
I want to compare the old and new description clearly,  
So that I can understand exactly what changed.

**Constraints:**
- Diff output must be readable to business users
- The user must not be forced to read raw HTML

**Acceptance Criteria:**
- Description changes are tracked in audit history
- Description change entries provide a View Diff action
- View Diff opens a dedicated comparison dialog
- The diff viewer supports both unified and split comparison modes
- Added, removed, and changed content are visually distinguishable
- Inline images in the description remain understandable within the diff experience
- If there is no meaningful difference, the UI communicates that clearly
- No console errors occur when opening or using the diff viewer

**Dependencies:**
- Description before/after values stored in audit metadata
- Diff viewer component available

**Impacted Areas:** Activity Feed, Audit History

---

## US-08: Advanced Filter Builder

**Feature Name:** Filter Builder

**Target User:** All authenticated users

**User Story:**  
As a user working with many suspense records,  
I want to build complex filters,  
So that I can narrow the list to exactly the records I need.

**Constraints:**
- Users must not be able to apply invalid or incomplete filter conditions
- Hidden columns must not appear as filterable fields if the product decision is to scope filters to visible columns

**Acceptance Criteria:**
- Users can open the filter builder from the list toolbar
- Users can create multiple filter conditions
- Users can combine conditions with AND / OR logic
- Users can create nested groups
- Users can remove conditions and groups
- Supported operators match the approved list behavior
- Null-check operators do not require a value
- Invalid conditions are blocked from being applied
- Applied filter state is visible from the list view
- Users can clear applied filters easily
- Applied filter state persists per user
- No console errors occur during filter create, apply, restore, or clear flows

**Dependencies:**
- `user_preferences` datatable provisioned
- Column metadata available to the list

**Impacted Areas:** List View

---

## US-09: Settings — Lookup Data Management

**Feature Name:** Settings

**Target User:** Super Admin

**User Story:**  
As a Super Admin,  
I want to manage lookup values from one protected screen,  
So that form and list options stay aligned with business configuration.

**Constraints:**
- Non-Super Admin users must not be able to access Settings
- Referenced lookup values must not be deleted if that would break data integrity

**Acceptance Criteria:**
- Settings is visible only to Super Admin users
- Non-admin users are blocked or redirected from direct Settings access
- Lookup categories can be viewed and managed from the Settings area
- Admin users can add, edit, and delete supported lookup values where allowed
- Changes are saved through the approved provider path
- Success and error feedback is shown through the application notification system
- No console errors occur during normal settings maintenance

**Dependencies:**
- Super Admin permission configured
- Lookup datatables provisioned

**Impacted Areas:** Create, Edit, List Filtering

---

## US-10: Role-Based Access Control

**Feature Name:** Access Control

**Target User:** All roles

**User Story:**  
As a system owner,  
I want access rules enforced consistently,  
So that users only see and do what they are allowed to.

**Constraints:**
- Users must not be able to elevate their own permissions
- Admin-only navigation must not be shown to unauthorized users

**Acceptance Criteria:**
- Record read, create, update, and delete permissions are enforced by role
- Protected UI actions are hidden or blocked for unauthorized users
- Settings access is restricted to Super Admin users
- Role-based assignment rules are enforced in the form experience (Analyst → SME only; SME → Analyst or Lead; Lead → all roles; Client → Analyst, SME, Lead)
- Save & Alert is visible to SME, Lead, and Client roles only (not Analyst)
- Navigation respects role-based visibility rules
- No console errors occur during normal permission-checked flows

**Dependencies:**
- Access-control policies configured
- Role mapping defined and stable

**Impacted Areas:** Entire Application

---

## US-11: Email Notifications

**Feature Name:** Notification Emails

**Target User:** Users involved in a suspense record

**User Story:**  
As a participating user,  
I want to receive relevant email notifications,  
So that I stay informed about important suspense record changes.

**Constraints:**
- Email sending must not block the main save flow
- Operational failures in notification delivery must not break create, edit, or comment actions

**Acceptance Criteria:**
- Record creation can trigger a notification email when applicable
- Record update can trigger a notification email when applicable
- Save & Alert triggers the additional alert notification flow
- Mentioning a user in a comment sends them an email notification immediately on post (fire-and-forget via email-send function, one per mentioned user)
- Notification payloads contain the required business context for the receiving user
- Notification failures are handled gracefully without breaking the primary action
- No user-facing error is caused solely by a notification delivery failure

**Dependencies:**
- `email-send` function deployed
- Email configuration and secrets available

**Impacted Areas:** Create, Edit, Comments

---

## US-12: User Preference Persistence

**Feature Name:** User Preferences

**Target User:** All authenticated users

**User Story:**  
As a user returning to the system,  
I want my list preferences to be remembered,  
So that I do not have to rebuild my workspace each time.

**Constraints:**
- Preferences must not be shared across users
- Preferences must not depend only on browser-local storage

**Acceptance Criteria:**
- Supported list preferences are stored per user
- Saved preferences are restored after login or reload
- Filter state persists per user
- Column-related preferences persist per user if supported in scope
- Preference writes update existing records where appropriate and create new records when needed
- Preference failures do not break the core list experience
- No console errors occur during normal preference read or write flows

**Dependencies:**
- `user_preferences` datatable provisioned
- User identity available

**Impacted Areas:** List View

---

## US-13: Screen Recording Attachment

**Feature Name:** Screen Recording

**Target User:** Users creating or updating suspense records

**User Story:**  
As a user working on a suspense record,  
I want to attach a screen recording to the record,  
So that I can provide visual evidence or context for the issue being tracked.

**Constraints:**
- Screen recordings must be associated with a specific suspense record
- Screen recordings must follow the same approved storage and permission rules as record attachments
- Users without record access must not be able to view or download the screen recording

**Acceptance Criteria:**
- A permitted user can add a screen recording while creating a suspense record
- A permitted user can add a screen recording while editing an existing suspense record
- Screen recordings are saved with the suspense record and remain available after reload
- Screen recordings are visible from the record detail view
- Screen recordings can be opened or downloaded by users with record access
- Existing screen recordings remain associated with the record unless removed by a permitted user
- No console errors occur while uploading, viewing, or downloading a screen recording

**Dependencies:**
- `suspense-attachments` storage bucket provisioned
- Record attachment permissions configured

**Impacted Areas:** Create, Edit, Detail View, Storage

---

## Definition of Ready

A story is ready when:
- the user, business outcome, and scope are clear
- the acceptance criteria are testable
- dependencies are known
- permission assumptions are explicit where relevant
- error and edge cases are considered
- unresolved product questions are captured separately

---

## Definition of Done

A story is done when:
- acceptance criteria are met
- build passes
- no critical browser-console issues remain in the covered flow
- access-control behavior matches the approved rules
- audit and notification behavior match the approved scope
- the implemented behavior matches the final agreed user story, not an outdated draft
