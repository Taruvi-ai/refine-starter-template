# OM/SOM Historical Approved KPI

## Objective

Count Kaizens approved by OM/SOM even after they advance beyond the immediate `Approved` status.

## Filter behavior

- Require OM/SOM comments to distinguish an OM/SOM decision from Lead/Manager approval.
- Include successful downstream workflow statuses through audit, implementation, incentive, certificate, and closure.
- Exclude OM/SOM rejections.

## Affected file

- `src/pages/om-som-dashboard/index.tsx`

## Verification

- The current `Certificate Generated` Kaizen is counted.
- The current `Submitted` Kaizen is not counted.
- The Approved KPI displays `1` with current data.
- TypeScript validation passes.
