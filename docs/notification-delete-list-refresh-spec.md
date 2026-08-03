# Notification Delete List Refresh

## Request

Deleting a notification from the Notifications menu should remove it from the table view.

## Fix

- Keep notification deletion as a soft-delete by setting `status` to `Deleted`.
- Exclude `Deleted` notifications from the default table query.
- Keep deleted notifications available through the explicit `Deleted` status filter.
- Add a confirmation dialog before the destructive delete action.
- Refetch the list, or move back a page when deleting the last row on a later page.

## Acceptance

- A deleted notification disappears from the normal Notifications table after confirmation.
- Selecting the `Deleted` status filter can still show soft-deleted notification records.
- Delete success and failure feedback uses the existing Refine notification provider.
