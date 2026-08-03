# Hide Reviews Menu For Employees

## Goal

Employee users should not see the Reviews navigation item. Review-capable roles should still see it, and the existing `/reviews` page guard should continue to enforce access if someone opens the route directly.

## Implementation

- `src/components/sidenav/MuiSidenav.tsx` now reads the existing `useKaizenRoles()` helper.
- When `roles.canReview` is false, the sidebar removes the `kaizen_reviews` / `/reviews` item from the Refine menu tree.
- The same filtered menu list is passed into `MobileBottomNav`, keeping desktop and mobile navigation aligned.
