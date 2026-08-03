# Settings Certificate Controls

## Objective

Super Admins can manage certificate templates and generated certificate records from the Settings page.

## Scope

- Add a Settings tab named `Certificates`.
- Allow a Super Admin to edit certificate template metadata, placeholder mappings, style JSON, signature JSON, status, and default flag.
- Allow a Super Admin to upload or replace a certificate background asset used by generation.
- Allow a Super Admin to regenerate a generated certificate for an eligible Kaizen.
- Allow a Super Admin to edit generated certificate metadata such as recipient, status, reward, issue date, and storage path.

## Eligibility

Regeneration is available for Kaizens in completed or certificate-ready states:

- `Certificate Generated`
- `Closed`
- `Audit Closed`
- `Approved`

## Implementation Notes

- Template and regeneration actions call the working `kaizen-cert-template-lite` function.
- Generated certificate metadata is edited through the `kaizen_certificates` datatable.
- Certificate files continue to live in the `kaizen-attachments` bucket.
- The broken legacy `kaizen-certificate-template-action` slug is not used by the frontend.
