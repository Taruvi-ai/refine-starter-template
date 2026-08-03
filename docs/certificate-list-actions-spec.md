# Certificate List Actions Spec

## Request

Show generated Kaizen certificates as a list. When a user clicks a certificate, offer Preview and Download actions.

## Current Flow

- Route `/certificates` renders `CertificateTemplatesPage` from `src/pages/operations/index.tsx`.
- Data comes from the Taruvi datatable provider via `useList` on `kaizen_certificates`.
- Certificate file URLs are built from `certificate_path` in the `kaizen-attachments` storage bucket.
- Role scoping is already handled in the page:
  - Admin and PE/QA see all certificates.
  - OM/SOM sees team certificates.
  - Employee sees their own certificates.

## Planned Change

- Keep the generated certificate table as the main page content.
- Remove the permanent side-by-side preview panel.
- Make each certificate row clickable.
- Open a small action menu with Preview and Download.
- Preview opens a dialog with the certificate image or iframe preview.
- Download uses the existing certificate file URL and filename helper.

## Affected Files

- `src/pages/operations/index.tsx`
