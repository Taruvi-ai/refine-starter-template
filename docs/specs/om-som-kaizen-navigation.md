# OM/SOM Kaizen Navigation

## Objective

Expose the Kaizen list in the OM/SOM sidebar and show submitted program Kaizens on that page.

## Role behavior

- OM/SOM: Kaizen menu visible; list shows submitted non-draft Kaizens.
- PE/QA and Admin: existing all-Kaizen behavior preserved.
- Employee: existing My Kaizens scope preserved.
- Lead/Manager: existing review-focused navigation preserved.
- OM/SOM cannot create or edit employee Kaizens.

## Affected files

- `src/components/sidenav/MuiSidenav.tsx`
- `src/pages/kaizens/list.tsx`

## Verification

- OM/SOM sidebar displays Kaizen.
- OM/SOM Kaizen page title is All Kaizens and shows current submitted records.
- TypeScript validation passes.
