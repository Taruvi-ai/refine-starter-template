# Review Comments Prefill

## Issue

Review comments were saved in `kaizen_ideas` and `kaizen_reviews`, but reopening the Review Kaizen dialog always reset the Comments field to blank.

## Expected Behavior

- Lead/Manager sees saved `manager_review_comments`.
- OM/SOM sees saved `om_som_comments`.
- PE/QA sees saved `pe_qa_comments`.
- Admin falls back to the latest available review comment field.

## Affected File

- `src/pages/reviews/index.tsx`
