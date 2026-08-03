# Hide Draft And Withdrawn Kaizens From Review And Notifications

## Request

Review Queue page and Notifications page should not show Draft or Withdrawn Kaizens.

## Scope

- Review Queue should exclude `status = Draft` and `status = Withdrawn` even when the user clears the status filter.
- Notifications should exclude notifications linked to Draft or Withdrawn Kaizens.
- Notifications without a linked Kaizen should remain visible.
- Keep deleted-notification filtering behavior unchanged.

## Implementation

- Add a shared blocked status list in `src/pages/reviews/index.tsx`.
- Add a permanent `status nin` filter to the Review Queue query.
- Add backend filter-tree support in `src/pages/notifications/index.tsx`.
- Add a permanent notification filter:
  - `idea_id` is null, or
  - linked `idea_id.status` is not in Draft/Withdrawn.
