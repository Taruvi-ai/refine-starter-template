# Certificate Title Wrapping

## Request

Fit the 120-character Kaizen title limit on generated certificates by using additional lines instead of clipping the title to one short line.

## Fix

- Updated the live `kaizen-cert-template-lite` Taruvi function.
- Moved the Kaizen title onto its own line below `For successfully completing`.
- Replaced the previous same-baseline title rendering with SVG `<tspan>` wrapping.
- Certificate titles now render across up to 2 lines inside the full available template area under the horizontal rule.
- Wrapping is based on estimated rendered text width, not a fixed character count, so long titles use the full line before moving to the next line.
- Wrapped titles use a smaller font, tighter line spacing, and a dynamic issue-date row so `under the KAIZEN PROGRAM` does not overlap the date.
- The certificate title text is capped at the UI title limit of 120 characters.
- Long unbroken words are split so they do not spill outside the certificate title area.
- The baked-in title and issue-date placeholder area is covered before writing the real title and date to avoid overlap or ghost text.

## Verification

- The updated function body passed Python syntax parsing before deployment.
- The saved function was re-read from Taruvi and confirmed to contain the new title coordinates and no old `x="293"` title placement.
- Existing certificate files were regenerated.
- `certificates/KZN-2026-MS-004.svg` was downloaded and rendered through Chrome; the `A3` title appears on its own line without overlap.
- A long 100+ character title was rendered locally through Chrome; the title, program line, and issue date are separated cleanly.
- A live `kaizen-cert-template-lite` preview with a 100+ character title was rendered through Chrome; the first title line uses the full field width before wrapping.
