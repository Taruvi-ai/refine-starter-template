# Logout Access

## Requirement

Users need a visible way to log out after the logout entry was removed from the main menu.

## Implementation

- Authenticated users can log out from the top Navkit profile/avatar dropdown.
- The logout action appears as a `Logout` menu item inside the existing profile menu.
- The logout action is not rendered in the left Kaizen sidebar.
- The action uses the Taruvi Navkit auth logout flow and redirects back to `/login`.
