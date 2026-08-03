# Certificate Template PNG Integration

## Goal

Use `Kaizen Certificate - 2026.png` as the active Kaizen certificate template background.

## Current Flow

- Certificate template metadata lives in `kaizen_certificate_templates`.
- Certificate downloads are stored through the `kaizen-attachments` bucket.
- `src/pages/operations/index.tsx` defaults new certificate templates to a background path.
- The Certificate Templates page previews the background path from storage when present.

## Implementation

- Upload the supplied PNG to `kaizen-attachments` at `certificate-templates/kaizen-certificate-2026.png`.
- Update the default template background path in `src/pages/operations/index.tsx`.
- Preview image templates as images and continue supporting PDF paths through an iframe fallback.
- Update existing active template metadata to reference the PNG path.

## Verification

- Confirm the storage upload succeeds.
- Confirm template rows now use the PNG background path.
- Run TypeScript check.
