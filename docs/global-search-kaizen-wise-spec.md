# Global Search Kaizen Wise Spec

## Scope

Update Global Kaizen Search so it behaves as a Kaizen-wise list. Status-wise differentiation is not needed on this page.

## Route And Resource Map

- UI route: `/global-search`
- Main datatable: `kaizen_ideas`
- Saved views datatable: `kaizen_saved_views`

## Provider And Auth Flow

- The page is inside the authenticated route boundary in `src/App.tsx`.
- Kaizens load through the default Taruvi datatable provider with `useList`.
- Saved views load and save through the default Taruvi datatable provider.
- Bulk actions still run through `executeFunction("kaizen-bulk-action", ...)`.
- Notifications use Refine's configured notification provider via `useNotification`.

## Data Contract

- Global Search filters may include search, date range, department, client, and category.
- The search box uses explicit case-insensitive field filters instead of the table full-text `search` vector so short Kaizen labels like `K1` and `K2` match reliably.
- Search matches Kaizen ID, title, status, stage, department, client, category, effort type, process, submitter, and lead fields.
- Status is shown as row data in the table and CSV export.
- Status is intentionally ignored for Global Search query filters and saved views.
- Rows are de-duplicated before display/export so each logical Kaizen appears once.
- If a draft row and a submitted row share the same submitter/title/department/client fingerprint, the numbered/latest row wins.
- The latest row is determined by `updated_at`, then `submitted_at`, then `created_at`; status progression breaks timestamp ties so `Submitted` wins over `Draft`.
- Other program pages can continue using status filters through the shared filter bar.

## Affected Files

- `src/pages/program/index.tsx`: Global Search filter normalization, export columns, and table columns.
- `docs/global-search-kaizen-wise-spec.md`: This implementation note.
