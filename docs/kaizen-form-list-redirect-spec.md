# Kaizen Form List Redirect Spec

## Issue

After saving a draft, the Kaizen form routes back to the edit page for the saved draft instead of returning to the list view. Submit already targets the list view, but the behavior should be expressed through the same redirect helper so save and submit stay consistent.

## Expected Behavior

- Saving a draft redirects to My Kaizens list.
- Submitting a Kaizen redirects to My Kaizens list.
- Existing validation failures continue to keep the user on the form.

## Implementation

- Add a shared `KAIZEN_LIST_ROUTE`.
- Route both successful `saveDraft` and `submitIdea` flows to `/kaizens` with `replace: true`.
