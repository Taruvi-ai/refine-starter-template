# Kaizen Page Padding Alignment

## Scope

Align the Kaizen list page with the page-level spacing used by the employee dashboard and other full-width application pages.

## Existing layout

- The authenticated layout removes its own content padding.
- Each page owns its responsive outer spacing through a MUI `Container`.
- The Kaizen list uses the standard responsive padding (`xs: 2`, `md: 3`) but limits content to `maxWidth="lg"`.
- The employee dashboard and the majority of list/dashboard pages use `maxWidth="xl"` with the same padding.

## Change

Use `maxWidth="xl"` on the Kaizen list container. Keep its existing responsive vertical and horizontal padding unchanged.

## Affected file

- `src/pages/kaizens/list.tsx`

## Verification

- Confirm the Kaizen list and employee dashboard have matching outer gutters at desktop widths.
- Confirm mobile padding remains unchanged.
- Run the TypeScript compiler without emitting files.
