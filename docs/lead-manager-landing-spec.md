# Lead Manager Landing Page

## Request

Lead/Manager users should land on the Team Dashboard instead of the standard Dashboard when they open the app or return from login.

## Scope

- Keep the existing `/team-dashboard` page and route.
- Change only the authenticated index route behavior.
- Apply the redirect only to pure Lead/Manager users.
- Do not redirect Admin, Super Admin, OM/SOM, PE/QA, or Employee roles.

## Implementation

- Add a role-aware landing component in `src/App.tsx`.
- Use `useKaizenRoles()` so role parsing stays consistent with the sidebar and review pages.
- While role data is loading, show a lightweight loading state.
- Redirect Lead/Manager users from `/` to `/team-dashboard`.
- Render the existing `Home` dashboard for all other roles.
