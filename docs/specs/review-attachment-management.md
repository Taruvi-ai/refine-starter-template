# Lead and OM Review Attachment Management

## Objective

Allow Lead/Manager and OM/SOM reviewers to list, download, upload, and delete Kaizen attachments while reviewing.

## Rules

- Upload supports up to 10 files per selection and 10 MB per file, with per-file results.
- Files use the `kaizen-attachments` bucket and `kaizen_attachments` metadata table.
- Metadata failure triggers cleanup of the new storage object.
- Delete requires a named confirmation stating that it cannot be undone.
- PE/QA and other roles retain their existing review UI.

## Affected file

- `src/pages/reviews/index.tsx`

## Verification

- Lead/Manager and OM/SOM receive attachment controls.
- Existing attachments remain downloadable.
- Queries refresh after upload/delete.
- TypeScript validation passes.
