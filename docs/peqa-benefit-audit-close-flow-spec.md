# PE/QA Benefit Audit Close Flow

## Requirement

PE/QA users need a clear place to audit Kaizen benefits and close the Kaizen after OM/SOM approval.

## Flow

- PE/QA uses **Reviews** for single Kaizen benefit audit.
- The PE/QA review queue defaults to OM/SOM-approved Kaizens.
- The audit dialog captures comments, hours saved, and rework reduction.
- PE/QA can choose:
  - `Close & Generate Certificate` (`Certificate Generated`)
  - `Return for Correction`
- PE/QA can also use **PE/QA Audit** for bulk status actions, including `Close Kaizen`.

## Backend Contract

The existing `kaizen-review-idea` function still supports `Audit Closed` for legacy compatibility, but the single-Kaizen audit dialogs expose only `Certificate Generated` and correction return decisions.
The existing `kaizen-bulk-action` function supports `Close`.
