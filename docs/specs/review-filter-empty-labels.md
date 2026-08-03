# Review Filter Empty Labels

## Objective

Ensure cleared Review Queue filters display meaningful values instead of blank select fields.

## Change

- Status empty value renders `All statuses`.
- Department empty value renders `All departments`.
- Labels remain shrunk so they do not overlap the rendered empty-state text.
- Applies to every role using the shared Review Queue.

## Affected file

- `src/pages/reviews/index.tsx`

## Verification

- Selecting `All statuses` leaves `All statuses` visible.
- Selecting `All departments` leaves `All departments` visible.
- TypeScript validation passes.
