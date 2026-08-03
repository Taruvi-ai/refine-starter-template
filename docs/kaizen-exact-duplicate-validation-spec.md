# Kaizen Exact Duplicate Validation

## Request

When a user updates idea details, block duplicate submitted ideas when the Title matches and either Client or Process also matches.

## Fix

- Added a live duplicate warning on the Kaizen form once Title and at least one of Client or Process are available.
- Queried likely matches by Title, then checked submitted ideas for the same Client or the same Process after trimming and case normalization.
- Excluded the current idea while editing so a record does not match itself.
- Added a server-backed preflight check before saving a draft or submitting an idea.
- Reused the same user-facing message for the warning and the blocker:
  "An idea with the same Title and either the same Client or Process has already been submitted."

## Acceptance

- Updating an idea to match an already-submitted record by Title plus Client or Process shows the duplicate message.
- Save Draft and Submit are prevented when an exact submitted duplicate exists.
- If no exact submitted duplicate exists, the existing save/submit flow continues.
