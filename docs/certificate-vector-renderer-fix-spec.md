# Certificate Template Renderer Correction

## Issue

Generated certificate SVG files looked wrong because the supplied `Kaizen Certificate - 2026.png` template was accidentally replaced with a custom vector-style certificate layout.

## Change

- Restored the supplied PNG certificate template as the source of truth.
- Uploaded/confirmed the template at `kaizen-attachments/certificate-templates/kaizen-certificate-2026.png`.
- Updated `kaizen-cert-template-lite` so generated SVG certificates embed the original PNG template and only overlay the recipient name, Kaizen title, and issue date.
- Wrapped long recipient names and Kaizen titles so 120-character titles can fit without spilling outside the template.
- Kept generated certificate paths stable, for example `certificates/KZN-2026-MS-004.svg`.
- Wired PE/QA certificate generation in the review queue and Kaizen detail audit dialog to regenerate the stored SVG immediately after closing the Kaizen.
- Regenerated the two existing certificate files:
  - `certificates/KZN-2026-MS-002.svg`
  - `certificates/KZN-2026-MS-004.svg`

## Expected Behavior

Future certificate downloads preserve the original EOX/Taruvi certificate design while replacing the template placeholders with Kaizen-specific data.
