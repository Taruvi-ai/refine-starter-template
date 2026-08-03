# Detail Page Audit Button

## Requirement

PE/QA users need an `Audit` action at the end of the Kaizen detail page, so they can audit a Kaizen after reviewing its full details.

## Implementation

`src/pages/kaizens/show.tsx` renders a bottom-aligned `Audit` button when:

- the current user has PE/QA access
- the Kaizen is in `PE/QA Audit`, or its status is `Approved`

The button opens the PE/QA audit dialog directly on the detail page and calls the existing `kaizen-review-idea` function with `reviewer_role: "PE/QA"`.

## Decisions

The dialog supports:

- `Close & Generate Certificate`
- `Return for Correction`

`Return for Correction` follows the correction-loop behavior: the Kaizen returns to the Lead/Manager queue and notifications are queued by the backend function.
