# Process Dropdown Blank Fix

## Problem

The Process select on the Kaizen form could appear blank when no active process matched the selected Department + Client, or when a saved draft had a `process_name` but the current filtered option list did not include that process row.

## Fix

- Added a process-label helper that reads `name` and falls back to `process_name`.
- Added explicit select states:
  - select Department and Client first
  - loading processes
  - no active processes for the selected route
  - choose process
- Kept the saved process label visible if an existing draft has a process that is not in the current filtered list.
- Mirrored selected client name into form state when the Client dropdown changes.
