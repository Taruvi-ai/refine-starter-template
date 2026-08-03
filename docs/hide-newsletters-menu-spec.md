# Hide Newsletters Menu

## Goal

Hide the Newsletters item from the app navigation without deleting the page or route.

## Implementation

- Removed `kaizen_newsletters` from the sidenav resource allowlist.
- Removed `/newsletters` from the sidenav route allowlist.
- Kept the existing `/newsletters` route and page intact for direct access or future reuse.

## Verification

- Run TypeScript check.
- Confirm the app route responds after the navigation change.
