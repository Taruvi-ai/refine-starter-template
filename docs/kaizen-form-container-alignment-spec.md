# Kaizen Form Container Alignment

## Objective

Reduce excessive side margins on the Submit, Edit, and Resubmit Kaizen form
while retaining the same responsive page padding and content width used by the
Dashboard.

## Change

- Change the form container from `maxWidth="md"` to `maxWidth="xl"`.
- Apply the same width to the edit loading state to prevent a layout shift.
- Preserve responsive padding at `xs: 16px / 24px` and `md: 24px / 32px`
  horizontally / vertically.
- Preserve the theme-managed card padding.

## Affected file

- `src/pages/kaizens/form.tsx`
