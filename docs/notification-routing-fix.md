# Notification Routing Fix

## Issue

Review notifications were being created for the Kaizen submitter, but Lead/Manager approval did not notify the OM/SOM reviewer group that an idea was waiting in `OM/SOM Review`.

## Fix

- Updated `kaizen-review-idea` to keep submitter notifications and also queue next-reviewer notifications.
- Lead/Manager approval now queues an OM/SOM review notification.
- OM/SOM approval now queues a PE/QA audit notification.
- Backfilled current OM/SOM review items with missing notification rows.
- Updated the Review Queue success popup to mention when the next reviewer was notified.
- Prevented the Notifications page from querying with a placeholder username before identity is loaded.

## Note

Rows are stored in `kaizen_notifications` with `status = "Queued"` for the app notification outbox. Users can mark them `Read` from the Notifications page.
