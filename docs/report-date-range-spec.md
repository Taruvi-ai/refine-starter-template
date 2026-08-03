# Report Date Range Spec

## Scope

Add an explicit date range option to the Reports section so users can choose a preset period or a custom start/end date before generating report archives.

## Route And Resource Map

- UI route: `/reports`
- Refine resource: `kaizen_reports`
- Archive datatable: `kaizen_report_archives`
- Generation function: `kaizen-generate-report`

## Provider And Auth Flow

- The page is inside the authenticated route boundary in `src/App.tsx`.
- Report archives load through the default Taruvi datatable provider with `useList`.
- Report generation runs through `executeFunction`, which calls the Taruvi app provider with `meta.kind: "function"`.
- Notifications use Refine's configured `useNotificationProvider` via `useNotification`.

## Data Contract

- `kaizen_report_archives.period_start` and `period_end` are date fields with an index.
- Archive filtering should use contained reporting-period matching:
  - `period_start >= selected start`
  - `period_end <= selected end`
  - Example: Current month Jun 01-Jun 18 should include an archived report for Jun 01-Jun 17.
- Generation payload must include `period_start` and `period_end` matching the selected range.

## Affected Files

- `src/pages/program/index.tsx`: Reports page date range controls and archive query state.
- `docs/report-date-range-spec.md`: This implementation note.
