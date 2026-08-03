# Team Dashboard Navigation

## Goal

Lead/Manager users should have a dedicated team dashboard where they can monitor ideas submitted by their team and open the review queue from there.

## Behavior

- Add a `Team Dashboard` route at `/team-dashboard`.
- The page uses live `kaizen_ideas` records filtered by `reporting_manager_username = current username`.
- Lead/Manager users see `Team Dashboard` in the left navigation.
- For Lead/Manager users, `Reviews` is nested under `Team Dashboard` instead of appearing as a separate top-level sidebar item.
- Other reviewer roles keep their existing `Reviews` access.
- Employees do not see `Team Dashboard` or `Reviews`.

## Affected Files

- `src/pages/team-dashboard/index.tsx`
- `src/App.tsx`
- `src/components/sidenav/MuiSidenav.tsx`
- `src/components/sidenav/MenuItem.tsx`
