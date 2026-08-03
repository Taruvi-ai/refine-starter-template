# Certificate Generation On Completion

## Goal

When a Kaizen is completed, generate a certificate artifact automatically from the active PNG template.

## Data Mapping

- Name field: Kaizen submitter display name, falling back to username.
- Title field: Kaizen title.
- Issue Date field: Kaizen completion timestamp, using `closed_at` from the completion action.

## Completion Triggers

- PE/QA final approval from `kaizen-review-idea`.
- Explicit `Certificate Generated` or `Audit Closed` decisions in `kaizen-review-idea`.
- PE/QA bulk audit actions that complete a Kaizen, including `Audit Pass` and `Close`.

## Storage

- Template background: `kaizen-attachments/certificate-templates/kaizen-certificate-2026.png`.
- Generated certificates: `kaizen-attachments/certificates/{kaizen_id}.svg`.
- Generated certificate metadata is written to `kaizen_certificates`.
- The Kaizen row stores the same path in `certificate_path` for direct access.
