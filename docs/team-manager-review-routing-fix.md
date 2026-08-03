# Team Manager Review Routing Fix

## Problem

`KZN/2026/QA/002`, submitted by `qa_kaizen_employee_20260610`, did not appear in the Lead/Manager review queue for `qa_kaizen_manager_20260610`.

The review queue intentionally filters Lead/Manager users to:

- `status = Submitted`
- `reporting_manager_username = current logged-in manager username`

The submitted row had `reporting_manager_username = qa_kaizen_peqa_20260608` because the Kaizen form overwrote the employee profile manager with the selected department manager.

## Fix

- `src/pages/kaizens/form.tsx` now preserves the submitter profile manager for new Kaizen routing.
- Department manager remains a fallback when the submitter profile does not provide a manager.
- The existing test row was reassigned to `qa_kaizen_manager_20260610` so it appears in that manager's review queue.
