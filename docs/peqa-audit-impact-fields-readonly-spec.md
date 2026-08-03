# PE/QA Audit Impact Fields Read-Only

## Request

QA users should not be able to edit Hours Saved or Rework Reduced % during audit.

## Implementation

- The PE/QA audit modal in the Review Queue now shows Hours Saved and Rework Reduced % as read-only.
- The PE/QA audit modal on the Kaizen detail page now shows the same two fields as read-only.
- The values remain visible and continue to be submitted with the audit decision.

## Files

- `src/pages/reviews/index.tsx`
- `src/pages/kaizens/show.tsx`
