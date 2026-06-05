# FMCSA Company Census API — POC

## Purpose

This POC proves that FMCSA Company Census data can be fetched **locally without authentication**
via the Socrata resource endpoint, and can serve as the **bulk carrier discovery / seed source**
for the Carrier Sales Intelligence app.

## Two-source architecture

| Source | Role | Auth required | Available locally |
|---|---|---|---|
| **FMCSA Company Census** (this POC) | Bulk discovery — seed the `carriers` table at scale | None | Yes |
| **SAFER scraper** (`tools/safer_poc/`) | Detail / verification — enrich a single carrier record | None (HTML parsing) | Yes for parsing; RDC only for live fetch |

The census gives you the list. SAFER gives you the full snapshot for a specific DOT.

## Endpoint

```
https://data.transportation.gov/resource/az4n-8mr2.json
```

Socrata unauthenticated resource endpoint. No API key, no OAuth, no RDC required.

The v3 API (`/api/id/az4n-8mr2`) returns 403 without an app token — do not use it.

## Socrata query behaviour (confirmed by live testing)

| Feature | Works? | Notes |
|---|---|---|
| `$where=status_code='A'` | ✓ | String equality works reliably |
| `$limit=N` | ✓ | Up to at least 500 per call; pagination via `$offset` |
| `$select=field1,field2,...` | ✓ | Column projection works |
| `$where=total_drivers >= 20` | ✗ | HTTP 400 — all numeric fields are stored as TEXT strings |
| `$order=total_drivers DESC` | ✗ (silent) | Silently caps response at ~5 rows regardless of `$limit` |
| `$having` | ✗ | HTTP 400 |

**Correct strategy:** Filter `status_code='A'` server-side, fetch 500 rows per page,
filter and sort `total_drivers` locally in Python after casting to `int`.

## Available fields (26 observed)

| Census field | Notes |
|---|---|
| `dot_number` | USDOT number string (maps to SAFER `usdot_number`) |
| `legal_name` | Company legal name |
| `dba_name` | DBA / trade name |
| `phy_street` | Physical street address |
| `phy_city` | Physical city |
| `phy_state` | 2-char state abbreviation — key filter for Stephen |
| `phy_zip` | Physical ZIP |
| `phy_country` | Country code |
| `carrier_mailing_street` | Mailing address |
| `carrier_mailing_city` | — |
| `carrier_mailing_state` | — |
| `carrier_mailing_zip` | — |
| `phone` | 10-digit string (no formatting) |
| `email_address` | ✓ **Present** — not available on SAFER snapshot |
| `power_units` | String integer |
| `total_drivers` | String integer |
| `status_code` | `"A"` = Active, `"I"` = Inactive |
| `carrier_operation` | Single-char code (`"A"` = Auth for Hire, `"C"` = Private, etc.) |
| `classdef` | Semicolon-delimited operation/cargo description |
| `mcs150_date` | MCS-150 form date (`"YYYYMMDD HHMM"` format) |
| `mcs150_mileage` | MCS-150 reported mileage string |
| `mcs150_mileage_year` | MCS-150 mileage year string |
| `business_org_desc` | `"CORPORATION"`, `"LLC"`, etc. |
| `hm_ind` | Hazmat indicator: `"Y"` / `"N"` |
| `crgo_genfreight` | `"X"` if carrier hauls general freight |
| `add_date` | Record creation date (`"YYYYMMDD"`) |

## `email_address` — important finding

`email_address` **is present** in this dataset and populated for many carriers.
It is **not available** on SAFER company snapshot pages.
This field should be included in the `carriers` DataTable schema.

## Schema impact vs. SAFER-only design

| Field | SAFER only | Census adds |
|---|---|---|
| `email` | not available | ✓ `email_address` |
| `phy_city` / `phy_state` / `phy_zip` | must be parsed from raw address string | ✓ pre-split, reliable |
| `carrier_mailing_*` | single string | ✓ pre-split mailing address |
| `business_org_desc` | not available | ✓ org type (Corporation, LLC, etc.) |
| `hm_ind` | not on snapshot | ✓ hazmat indicator Y/N |
| `add_date` | not on snapshot | ✓ date first registered |
| `carrier_operation` (code) | checkbox list (verbose) | single-char code |
| `classdef` | parsed from checkbox | semicolon string — denormalised |

**Recommended schema update:** Add `email`, `phy_city`, `phy_state`, `phy_zip`,
`mailing_city`, `mailing_state`, `mailing_zip`, `business_org_type`, `hm_ind`,
`census_add_date` to the `carriers` table. These arrive clean from the census and
do not require address parsing.

## Structure

```
tools/company_census_poc/
  scripts/
    fetch_sample.py    # Live fetch script — no auth, runs locally
  samples/
    active_20_plus_drivers.json   # 25 active carriers, sorted by total_drivers desc
    columns_observed.json         # Full list of observed field names
  README.md
```

## Scope

This is a **local POC / tooling area only**.

- Not connected to any Taruvi Platform app or DataTable yet.
- Does not ingest data into the Platform.
- Stephen does not see this tooling.
- Live fetching works locally — no RDC needed.
