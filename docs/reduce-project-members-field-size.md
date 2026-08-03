# Reduce Project Members Field Size

## Goal

Make the Project Members input in the Kaizen form take less vertical space.

## Changes

- Reduced the multiline field from 3 rows to 2 rows.
- Shortened the helper text while preserving the expected entry format.

## Verification

- TypeScript should pass with `tsc --noEmit --pretty false`.
