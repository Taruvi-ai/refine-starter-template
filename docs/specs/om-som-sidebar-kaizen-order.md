# OM/SOM Sidebar Kaizen Order

## Objective

Place the Kaizen navigation item immediately after Review for OM/SOM users.

## Behavior

- Apply ordering only to the OM/SOM-only navigation view.
- Preserve role filtering and all other item order.
- Use the reordered collection for desktop navigation, search results, and mobile navigation.

## Affected file

- `src/components/sidenav/MuiSidenav.tsx`

## Verification

- OM/SOM order includes `Review` followed immediately by `Kaizen`.
- Other role menu ordering remains unchanged.
- TypeScript validation passes.
