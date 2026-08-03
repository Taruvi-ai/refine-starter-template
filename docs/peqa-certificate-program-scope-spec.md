# PE/QA Certificate Program Scope

## Issue

The certificate page is designed to show all generated certificates for PE/QA users, but PE/QA recognition was too narrow. If the current identity exposed the role through permission groups, `role_slug`, `roles`, or PE/QA naming variants, the UI could fall back to personal certificate scope and show a blank list.

## Expected Behavior

- PE/QA sees every generated Kaizen certificate.
- Employee/personal roles continue to see only their own certificates.
- OM/SOM keeps team/non-own certificate scope.
- Role detection supports common PE/QA slugs and names such as `peqa`, `PE/QA`, `QA`, `PE`, `Quality Assurance`, and `Quality Analyst`.

## Implementation

Broaden the shared `useKaizenRoles` role signal collection and PE/QA matcher so all pages use the same corrected scope.

