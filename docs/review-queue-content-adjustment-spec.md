# Review Queue Content Adjustment

## Request

Adjust the Review Queue page content so the page reads correctly for the reviewer using it.

## Scope

- Keep the existing review workflow and filters.
- Update visible page content only.
- Make copy role-aware for:
  - Lead/Manager
  - OM/SOM
  - PE/QA
  - Admin or mixed review roles

## Implementation

- Add a small role-aware content map in `src/pages/reviews/index.tsx`.
- Use that content for:
  - page title
  - subtitle
  - search placeholder
  - impact column heading
  - empty-state copy
  - review dialog title

## Expected Result

Lead/Manager users see a clean team review queue focused on submitted team Kaizens, instead of generic audit/certificate wording.
