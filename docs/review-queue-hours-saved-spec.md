# Review Queue Hours Saved Column

## Scope

Update the Review Queue table so the impact column shows hours saved instead of cost saved.

## Affected Files

- `src/pages/reviews/index.tsx`

## Expected Behavior

- Column header reads `Hours Saved`.
- Row value uses `hours_saved` when review impact is already saved.
- Submitted rows without saved `hours_saved` derive hours from category impact inputs.
- Empty values render consistently.
