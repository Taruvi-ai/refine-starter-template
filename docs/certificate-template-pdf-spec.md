# Certificate Template PDF Integration

> Superseded: the active certificate background is now `Kaizen Certificate - 2026.png` at `certificate-templates/kaizen-certificate-2026.png`. See `docs/certificate-template-png-spec.md`.

## Goal

Use `EOX Certificate Template - 2026.pdf` as the active certificate template background for Kaizen certificate templates.

## Current Flow

- Certificate template metadata lives in `kaizen_certificate_templates`.
- Generated certificate records live in `kaizen_certificates` and expose `certificate_path` for downloads.
- Existing certificate generation in `kaizen-review-idea` creates the certificate record/path, but does not render a PDF file.
- Certificate template management UI is `src/pages/operations/index.tsx`.
- Storage is available through the Taruvi storage provider and the `kaizen-attachments` bucket.

## Implementation

- Upload the supplied PDF to `kaizen-attachments` at `certificate-templates/eox-certificate-template-2026.pdf`.
- Set `background_path` on active default certificate templates to that PDF path.
- Update the Certificate Templates preview to show the PDF when `background_path` is present, falling back to `preview_html`.

## Verification

- Confirm storage upload returns `uploaded_count: 1`.
- Confirm active default template rows have `background_path`.
- Run TypeScript check and route check for `/certificate-templates`.
