# Sidebar Width 86px Spec

## Request

Increase the collapsed desktop side menu width to `86px`.

## Scope

- Desktop collapsed sidebar rail only.
- Keep expanded sidebar behavior unchanged.
- Let collapsed labels use the additional width.

## Implementation

- Move sidebar width values into shared sidenav constants.
- Set collapsed width to `86px`.
- Increase collapsed label max width from `56px` to `70px` to match the wider rail after horizontal item margins.
- Update the design token and UI guideline note so documentation matches the app.
