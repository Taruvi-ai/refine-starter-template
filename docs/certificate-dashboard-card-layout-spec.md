# Certificate Dashboard Card Layout

## Request

The dashboard `Certificates` card clipped the `Download` action when certificate rows had status, view, and download controls on the same line.

## Implementation

- Updated `src/pages/home/index.tsx`.
- Changed each certificate row to a compact two-line layout:
  - Certificate number and status on the first line.
  - Issued date/reward and actions on the second line.
- Kept action buttons compact and allowed wrapping so they remain inside the card at narrower widths.

## Expected Behavior

The `View` and `Download` buttons should remain fully visible inside the Certificates card.
