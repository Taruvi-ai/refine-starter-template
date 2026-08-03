# PE/QA Dashboard All Kaizens Spec

## Goal

PE/QA users need their dashboard to show the full Kaizen program view instead of only Kaizens submitted by their own username.

## Changes

- Home dashboard uses all `kaizen_ideas` rows for PE/QA users.
- PE/QA dashboard labels switch from personal wording to program wording.
- Certificate and recent Kaizen panels follow the same all-program scope for PE/QA.
- The `/kaizens` list opened from the dashboard also shows all Kaizens for PE/QA.

## Verification

- Run TypeScript with `npx tsc --noEmit --pretty false`.
- Do not start the dev server or production build.
