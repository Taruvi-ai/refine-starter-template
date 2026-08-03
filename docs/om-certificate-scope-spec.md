# OM Certificate Scope

## Requirement

OM/SOM users do not submit Kaizen ideas, so the Certificate page should not be scoped to certificates where `recipient_username` is the OM user.

## Rule

- Employee and other personal roles see their own certificates.
- OM/SOM sees team/non-own certificates: `recipient_username != current username`.
- Admin and PE/QA keep program-wide certificate visibility.
- The short `OM` role slug is treated as an OM/SOM role for navigation and certificate scoping.

## Affected Files

- `src/pages/kaizens/shared.tsx`
- `src/pages/operations/index.tsx`
- `src/pages/home/index.tsx`
