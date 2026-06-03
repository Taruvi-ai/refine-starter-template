# SAFER Parser — POC

Isolated tooling for parsing FMCSA SAFER company-snapshot HTML.

## Architecture

```
RDC (live SAFER fetch)  →  saves HTML  →  copied locally
                                              ↓
                                   tools/safer_poc/raw_html/
                                              ↓
                                   src/safer_parser.py  (local, no network)
                                              ↓
                                   tools/safer_poc/parsed/
```

### Why two environments?

Live SAFER access (`ai.fmcsa.dot.gov`) is **403 from local machines** — it only works from an RDC (Remote Desktop Connection) environment. The parser is therefore intentionally decoupled from any fetching logic. RDC saves raw HTML; local development reads those fixtures.

## Structure

```
tools/safer_poc/
  raw_html/          # saved SAFER HTML responses
  parsed/            # parser output JSON files
  src/
    models.py        # CarrierSnapshot dataclass
    safer_parser.py  # parse_safer_html() — stdlib only, no network
  scripts/
    parse_fixture.py # CLI: reads raw_html/, writes parsed/
  tests/
    fixtures/        # HTML fixtures used by tests
    test_safer_parser.py
  README.md
```

## Usage

```bash
cd tools/safer_poc

# Parse default fixture (raw_html/usdot_*.html → parsed/*.json)
python scripts/parse_fixture.py

# Parse a specific file
python scripts/parse_fixture.py raw_html/usdot_2874852.html

# Run tests
.venv/bin/python -m pytest tests/ -q
```

## CarrierSnapshot field coverage

The `CarrierSnapshot` dataclass in `src/models.py` covers every field exposed on the SAFER
company-snapshot page.

### Fields successfully parsed from current fixtures

| Field | Notes |
|---|---|
| `page_type` | `CARRIER` / `NOT_FOUND` / `INACTIVE` |
| `usdot_number` | Extracted from snapshot or from error-page message |
| `legal_name` | — |
| `dba_name` | Present on `154740` (RAIN FOR RENT), `3960415` (FRONTIER) |
| `entity_type` | Always "CARRIER" for valid pages |
| `usdot_status` | "ACTIVE" / "INACTIVE" |
| `mc_mx_ff_numbers` | Present on `154740` (MC-384359) |
| `duns_number` | Present on `359711`; `--` normalised to `None` |
| `out_of_service_date` | `None` for all current fixtures (all ACTIVE) |
| `operating_authority_status` | "NOT AUTHORIZED" or "AUTHORIZED FOR …" |
| `physical_address` | Full string |
| `mailing_address` | Full string |
| `phone` | — |
| `power_units` | Integer; `399,997` → `399997` |
| `drivers` | Integer |
| `mcs_150_form_date` | `MM/DD/YYYY` string |
| `mcs_150_mileage` | Integer miles; `17,561,354` → `17561354` |
| `mcs_150_mileage_year` | Integer year, e.g. `2025` |
| `us_inspections_total` | 24-month total |
| `us_crashes_fatal` | — |
| `us_crashes_injury` | — |
| `us_crashes_tow` | — |
| `us_crashes_total` | — |
| `canada_inspections_total` | 24-month total |
| `canada_crashes_fatal` | — |
| `canada_crashes_injury` | — |
| `canada_crashes_tow` | — |
| `canada_crashes_total` | — |
| `safety_rating` | Present on `154740` ("Satisfactory"); `None` for unrated carriers |
| `safety_rating_date` | Present on `154740` |
| `safety_review_date` | Present on `154740` |
| `safety_review_type` | Present on `154740` ("Non-Ratable") |
| `operation_classification` | Checkbox list |
| `carrier_operation` | Checkbox list |
| `cargo_carried` | Checkbox list |

### Fields supported but not present in current fixtures

These fields exist in `CarrierSnapshot`, the parser has the extraction logic in place,
and the HTML label is confirmed to appear on the SAFER snapshot page — but their values
happen to be blank / `None` across all 6 current fixtures.

| Field | SAFER label | Blank because… |
|---|---|---|
| `state_carrier_id` | "State Carrier ID Number:" | None of the 6 carriers have a state ID on file |
| `out_of_service_date` | "Out of Service Date:" | All 4 valid carriers are ACTIVE |
| `safety_rating` (Conditional/Unsatisfactory) | "Carrier Safety Rating:" sub-table | Only `154740` has a rating; need a carrier with a Conditional or Unsatisfactory rating to test |
| `mcs_150_mileage` / `mcs_150_mileage_year` | "MCS-150 Mileage (Year):" | `2874852` has no mileage on file; all others do |

To exercise these, fetch additional carrier fixtures from RDC that include:
- a carrier with Out of Service Date set
- a carrier with a Conditional or Unsatisfactory safety rating
- a carrier with a State Carrier ID on file

### Fields that require a different SAFER or FMCSA page

These are **not** on the SAFER company-snapshot page and cannot be parsed from the current HTML:

| Field | Source |
|---|---|
| Per-inspection breakdown (vehicle / driver / hazmat / IEP OOS counts) | SAFER company snapshot — present but not yet modelled in `CarrierSnapshot` (future expansion) |
| MC number status / authority history | SAFER operating-authority detail page |
| Insurance on file | FMCSA L&I system (separate URL) |
| Safety Measurement System (SMS) scores | FMCSA SMS portal (separate system) |
| Crash Indicator / HOS / Vehicle Maintenance BASIC scores | FMCSA SMS |
| Email address | Never on SAFER |
| Historical MCS-150 filings | Not on snapshot |

## Scope

This is a **POC / tooling area only**.

- Not the Stephen-facing UI.
- Not connected to any Taruvi Platform app, DataTable, or schema yet.
- Live SAFER fetching is handled separately on RDC and is outside this directory.
