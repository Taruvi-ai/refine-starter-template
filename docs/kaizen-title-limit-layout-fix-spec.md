# Kaizen Title Limit Layout Fix

## Request

Long Kaizen titles can spill outside the page and push following action buttons out of alignment.

## Fix

- Limit new/edit Kaizen titles to 120 characters.
- Show a live title character counter in the Kaizen form.
- Block draft save and final submit when an existing over-limit title is edited.
- Render Kaizen titles with overflow-safe ellipsis/tooltips in list and review tables.
- Clamp long titles in the Kaizen detail header so action buttons stay aligned.

## Acceptance

- Users cannot enter more than 120 characters in the title field.
- Existing long titles do not stretch table rows or move action buttons.
- Full title text remains available on hover.
