# My Kaizens Row Double Click

## Request

Double-clicking a Kaizen row in My Kaizens should open that Kaizen.

## Cause

The list only wired navigation to the row action icon. Table rows had no double-click handler, so double-clicking row content did nothing.

## Scope

- Add double-click navigation from Kaizen rows to the show page.
- Keep action buttons, checkboxes, and other interactive controls from triggering row navigation accidentally.
- Reuse the same show route as the existing view icon.

## Affected Files

- `src/pages/kaizens/list.tsx`

## Verification

- TypeScript check should pass.
- Double-clicking non-control row content should open `/kaizens/show/:id`.
- Clicking existing action buttons should keep current behavior.
