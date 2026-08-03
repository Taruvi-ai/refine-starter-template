# PE/QA Certificate Generate Redirect

## Request

For QA users, after clicking Generate Certificate, the app should return to the list view instead of leaving the user in Kaizen view mode.

## Implementation

- Updated the Kaizen detail PE/QA audit success flow.
- When the audit decision is `Certificate Generated`, the app now navigates to `/reviews` after showing the success notification.
- Other audit outcomes keep the existing detail-page refetch behavior.

## Files

- `src/pages/kaizens/show.tsx`
