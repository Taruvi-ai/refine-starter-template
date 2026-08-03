# Certificate Route 404 Fix

## Issue

Users can land on a 404 page when opening the Certificate section through a certificate-oriented URL such as `/certificates` or `/certificate`.

## Cause

The generated certificate page is registered through the `kaizen_certificates` resource, but the only route in `App.tsx` was `/certificate-templates`. That route name no longer matches the user-facing Certificate section.

## Fix

- Make `/certificates` the primary resource list path for `kaizen_certificates`.
- Keep `/certificate-templates` as a backward-compatible alias.
- Add `/certificate` as a forgiving alias.
- Update the custom sidebar route allow-list so Certificate remains visible and selected.

## Verification

- TypeScript compile should pass.
- `/certificates`, `/certificate`, and `/certificate-templates` should all render the Certificates page instead of Refine's 404 component.
