# Comments Section Enhancement

## Existing resources

- `kaizen_ideas`: Kaizen ownership and workflow participants.
- `kaizen_comments`: Persistent comments with `parent_comment_id` for replies.
- `kaizen_notifications`: In-app notification outbox.
- `kaizen-comment-action`: Authenticated create/edit/delete comment orchestration.
- `src/pages/kaizens/show.tsx`: Kaizen detail tabs and role-aware page access.

## Change contract

- Store each comment or reply in `kaizen_comments`.
- Add `author_role` so the UI can display the role captured when the entry was posted.
- A reply references its parent through `parent_comment_id` and must belong to the same Kaizen.
- Require non-empty text and derive author identity and role from the authenticated session.
- Notify the Kaizen submitter, lead/reporting manager, current responsible user, project members, and the parent-comment author, excluding the commenter.
- Preserve mention notifications and comment audit records.
- Display chronological threaded discussions with Name, Role, Date & Time, Comment, and Reply action.

## Affected files/resources

- Live schema: `kaizen_comments`
- Live function: `kaizen-comment-action`
- Frontend: `src/pages/kaizens/show.tsx`

## Verification

- Re-read the live schema and function.
- Execute validation-only calls that do not create records.
- Run `npx tsc --noEmit`.
