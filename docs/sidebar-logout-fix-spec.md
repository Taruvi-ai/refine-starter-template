# Profile Menu Logout Fix

## Issue

Logout must be available from the top Navkit profile/avatar menu. The previous sidebar logout behavior is no longer used.

## Expected Behavior

- Clicking the top profile/avatar menu shows a `Logout` option.
- Clicking `Logout` clears the Taruvi session.
- The user is redirected back to the app login route.
- The left Kaizen sidebar does not show logout.

## Implementation

Use the local Navkit profile menu and call Taruvi auth logout with an absolute `/login` callback URL built from `window.location.origin`.
