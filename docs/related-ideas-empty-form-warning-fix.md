# Related Ideas Empty Form Warning Fix

## Goal

Prevent the Kaizen form from showing the related-ideas warning before the user has entered any meaningful idea text.

## Cause

The related-ideas query included auto-filled `process_name`, so the form could find related records even when Title and Problem Statement were empty.

## Changes

- Related-ideas search now uses only Title and Problem Statement as the trigger text.
- The query is enabled only after that text is longer than 8 characters.
- `process_name` can still refine the search after the user has entered enough idea text.
- Stale related results are hidden when the trigger text is too short.

## Verification

- TypeScript should pass with `tsc --noEmit --pretty false`.
