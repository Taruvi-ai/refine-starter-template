# Remove Quality Improvement KPI

## Scope

Remove the `Quality Improvement` card from the executive dashboard KPI row for layout review.

## Layout behavior

- Preserve the underlying quality calculations used elsewhere on the dashboard.
- Keep the remaining five KPI cards.
- Use five equal columns at extra-large desktop widths so no empty sixth slot remains.
- Retain the existing responsive one-, two-, and three-column behavior at smaller widths.

## Affected file

- `src/pages/home/index.tsx`

## Verification

- The Quality Improvement KPI is absent.
- Five remaining cards fill the desktop row evenly.
- TypeScript validation passes.
