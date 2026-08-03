# Report Archive Layout Polish

## Requirement

The Reports page archive table became difficult to scan after adding separate Owner, Department, Client, and Process columns. Arrange the table so it remains readable with all required columns present.

## Implementation

- Updated `src/pages/program/index.tsx`.
- Kept separate columns for `Owner`, `Department`, `Client`, and `Process`.
- Added fixed table layout and explicit column widths.
- Added a bordered horizontal scroll area around the table.
- Added no-wrap text cells with hover tooltips for long values.
- Replaced the wider `Open` text button with a compact icon action.
- Added report archive search filters for these fields only:
  - Kaizen
  - Owner
  - Department
  - Client
  - Process
- Removed the Status, Submitted, and Impact filter controls from the archive toolbar.
- All five archive filters use text search and push filtering to the backend query.
- Filter chips show active filters and support clearing one filter or all filters.
- Kept the Actions column visible so each row can still be opened.

## Verification

- Checked the updated table markup.
- Ran `npx.cmd tsc --noEmit --pretty false`; it still stops on the existing unrelated `src/pages/kaizens/form.tsx` type error.
