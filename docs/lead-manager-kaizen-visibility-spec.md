# Lead Manager Kaizen Visibility Fix

## Issue

Lead/Manager users can miss Kaizens submitted by their employees when the submitter profile stores the manager under `reporting_manager_username` instead of `manager_username`.

Current lead-facing pages primarily filter `kaizen_ideas.reporting_manager_username = current user`. If a Kaizen was saved with a department manager or blank manager, the correct lead only sees a partial team list.

## Expected Behavior

- Employee profile manager is the primary routing source.
- Both supported attribute keys are accepted:
  - `manager_username`
  - `reporting_manager_username`
- Department manager is used only when the employee profile does not provide a manager.
- Lead pages include directly routed Kaizens and, when hierarchy assignments exist, Kaizens submitted by assigned employees.

## Affected Areas

- Kaizen create/edit routing payload.
- Lead/Manager Team Dashboard.
- Review Queue lead scope.
- Home review-count card.
- Hierarchy sync function.
