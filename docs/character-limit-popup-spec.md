# Character Limit Popup Spec

## Scope

The current UI has one enforced character-count rule: correction/rejection reasons must be at least 20 characters.

Covered surfaces:
- Review Queue modal (`src/pages/reviews/index.tsx`)
- Kaizen detail PE/QA audit modal (`src/pages/kaizens/show.tsx`)

## Resources and Providers

- Function execution continues through `executeFunction("kaizen-review-idea", ...)`, backed by the Taruvi app provider.
- User feedback uses the existing Refine MUI notification provider from `src/App.tsx`.
- No new datatables, auth providers, or notification systems are introduced.

## Behavior

- The inline helper remains visible as `current/20 minimum characters`.
- If a user leaves a correction/rejection reason field before entering 20 characters, a popup notification appears.
- If the save path is triggered while the reason is too short, the same popup notification appears.
- Category-required validation is kept separate from character-limit validation.

## Affected Files

- `src/utils/reviewValidation.ts`
- `src/pages/reviews/index.tsx`
- `src/pages/kaizens/show.tsx`
