# Remaining User Stories Spec

## Source

`support_documents/1-10us.md` contains the current Kaizen user stories. Most of the backend resources, functions, seed data, and Refine pages already exist.

## Remaining Acceptance Criteria

- US-5 Related Ideas: related idea cards need a direct way to open full details from the submission form.
- US-6 Feasibility Review: review queue filters need employee and submission date controls; approve/reject comments must be mandatory.
- US-9 Employee Dashboard: dashboard certificates need a download action, not only a status row.
- US-10 Admin Roles: role-change audit rows need to be visible in the admin screen.

## Backend Adjustment

- `kaizen-review-idea` should reject any review decision submitted without comments, while preserving the existing 20-character minimum and category requirement for rejections.

## Affected Files

- `src/pages/kaizens/form.tsx`
- `src/pages/reviews/index.tsx`
- `src/pages/home/index.tsx`
- `src/pages/admin/users.tsx`
- `docs/kaizen-project-spec.md`
