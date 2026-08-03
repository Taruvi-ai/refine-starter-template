# Trimmed Sidebar Navigation

## Goal

The left navigation should only show the primary Kaizen pages requested by the business user:

- Dashboard
- My Kaizen
- Reviews (Lead/Manager and reviewer roles only)
- Notification
- Leaderboard
- Audit Logs
- Report
- Global Search
- High Impact Kaizen
- Newsletters
- Certificate

## Implementation

- `src/components/sidenav/MuiSidenav.tsx` now filters Refine menu items through a fixed sidebar whitelist.
- The whitelist is applied before desktop sidebar rendering and before the mobile bottom navigation receives menu items.
- `Reviews` is included in the whitelist but still hidden unless `useKaizenRoles().canReview` is true.
- Routes and Refine resources remain registered in `src/App.tsx`, so hidden operational/admin pages are still available by direct route if needed.
- `src/App.tsx` resource labels were aligned to the requested display names.
