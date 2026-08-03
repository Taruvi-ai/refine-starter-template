# Report Page Owner, Department, Client, and Process Columns

## Requirement

On the Reports page, show Owner, Department, Client, and Process as separate columns instead of combining owner and department in one `Owner / Department` cell.

## Implementation

- Updated `src/pages/program/index.tsx`.
- Split the Report Archive table header into `Owner`, `Department`, `Client`, and `Process`.
- Rendered submitter name/username in the `Owner` column.
- Rendered `department_name` in the `Department` column.
- Rendered `client_name` in the `Client` column.
- Rendered `process_name` in the `Process` column.
- Updated loading, error, invalid-period, and empty-state column spans from 6 to 9.

## Verification

- Ran `npx.cmd tsc --noEmit --pretty false`.
- The check did not report an error in the Reports page change, but it stopped on an existing unrelated error in `src/pages/kaizens/form.tsx`.
