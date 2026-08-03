# Kaizen Multiple Attachments

## Request

Give users the option to upload multiple attachments on a Kaizen.

## Scope

- Make the attachment upload control explicitly support multiple file selection.
- Keep files queued when users select files in multiple rounds.
- Show selected file count and total size before saving/submitting.
- Allow removing individual queued files or clearing the whole queue.
- Upload selected attachments in batches of up to 10 files.

## Affected Files

- `src/pages/kaizens/form.tsx`

## Verification

- TypeScript check should pass.
- Users should be able to select multiple files from the file picker.
- Users should be able to add more files after the first selection.
- All queued files should be uploaded when saving draft or submitting.
