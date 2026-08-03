# Team Dashboard KPI Count Fix

## Issue

All Team Dashboard KPI cards can show the same number because the page combines a backend JSON team-scope filter with additional plain Refine filters.

## Cause

`leadManagerIdeaFilters()` returns a special `filters` JSON tree. The Team Dashboard then appends `status`, `approved_at`, and High Impact filters as separate filter entries. Those appended filters are not reliably merged into the backend JSON filter tree, so the KPI count queries can all resolve to the base team total.

## Fix

- Build Team Dashboard filters as one backend filter tree per query.
- Keep the same Lead/Manager team scope:
  - direct `reporting_manager_username`
  - assigned employee submissions
  - exclude the manager's own submissions
- Add each KPI condition inside that same filter tree:
  - Needs Review: Lead/Manager Review stage and Submitted/Resubmitted status
  - Approved: `approved_at` present
  - Rejected: Rejected status
  - High Impact: Nominated or Approved nomination status

## Verification

Run TypeScript validation after the change.
