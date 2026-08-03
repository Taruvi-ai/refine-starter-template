# Kaizen Attachment Visibility Spec

## Issue

Attachment metadata is created in `kaizen_attachments` when a Kaizen draft is saved or submitted, but saved files are not visible in the edit form. In the read-only Kaizen view, files are only available inside the Files tab, so users can miss them when landing on the Overview tab after opening a Kaizen.

## Expected Behavior

- Existing uploaded files show when editing a saved draft.
- Newly selected files remain visible before saving.
- The Kaizen show Overview includes the uploaded files summary.
- The Files tab still shows the complete uploaded file list.

## Implementation

- Load `kaizen_attachments` by `idea_id` in edit mode.
- Display saved files in the form Attachments section with download actions.
- Reuse storage URLs from the shared storage helper.
- Add a Files section to the show Overview and keep the dedicated Files tab.
