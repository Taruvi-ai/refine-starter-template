"""
FMCSA Company Census API — sample fetch POC.

Endpoint: https://data.transportation.gov/resource/az4n-8mr2.json
Auth: none required (Socrata unauthenticated resource endpoint)

Key findings from field investigation:
  - All numeric fields (total_drivers, power_units, mileage, etc.) are stored as TEXT strings.
  - $where numeric comparisons (>= 20) return HTTP 400.
  - $order on string-numeric fields silently caps results at ~5 rows regardless of $limit.
  - $where status_code='A' works (string equality) and is the only reliable server-side filter.
  - Correct approach: server-side status filter, local numeric filtering, local sort.

Saves output to:
  ../samples/active_20_plus_drivers.json
  ../samples/columns_observed.json
"""
import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

_HERE = Path(__file__).resolve().parent
_SAMPLES = _HERE.parent / "samples"
_SAMPLES.mkdir(exist_ok=True)

BASE_URL = "https://data.transportation.gov/resource/az4n-8mr2.json"

# All fields available and useful for the carrier sales use-case.
# Note: email_address, mailing address fields, and cargo fields also exist.
SELECT_FIELDS = ",".join([
    "dot_number",
    "legal_name",
    "dba_name",
    "phy_street",
    "phy_city",
    "phy_state",
    "phy_zip",
    "phy_country",
    "carrier_mailing_street",
    "carrier_mailing_city",
    "carrier_mailing_state",
    "carrier_mailing_zip",
    "phone",
    "email_address",
    "power_units",
    "total_drivers",
    "status_code",
    "carrier_operation",
    "classdef",
    "mcs150_date",
    "mcs150_mileage",
    "mcs150_mileage_year",
    "business_org_desc",
    "hm_ind",
    "crgo_genfreight",
    "add_date",
])

# Fetch enough rows to find 25 qualifying after local filter.
FETCH_LIMIT = 500
RESULT_LIMIT = 25


def main() -> None:
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})

    print(f"Endpoint: {BASE_URL}")
    print(f"Fetching up to {FETCH_LIMIT} active rows (server-side status_code='A' filter)...")
    print("Note: numeric $where (total_drivers >= 20) not supported — all numeric fields are TEXT strings.")
    print("      Ordering by total_drivers server-side silently caps results at ~5. Sorting locally instead.")

    # Server-side: filter active only.
    # No $order here — ordering on string-numeric fields silently breaks $limit.
    params = {
        "$limit": FETCH_LIMIT,
        "$select": SELECT_FIELDS,
        "$where": "status_code='A'",
    }
    resp = session.get(BASE_URL, params=params, timeout=30)
    resp.raise_for_status()
    all_active = resp.json()
    print(f"Active rows fetched from API: {len(all_active)}")

    # Collect observed columns before we mutate rows
    all_keys: set[str] = set()
    for row in all_active:
        all_keys.update(row.keys())
    columns_observed = sorted(all_keys)

    # Local filter: total_drivers >= 20
    qualified = []
    for row in all_active:
        try:
            drivers = int(row.get("total_drivers") or 0)
        except (ValueError, TypeError):
            drivers = 0
        if drivers >= 20:
            row["_total_drivers_int"] = drivers  # attach int for sorting
            qualified.append(row)

    # Sort by drivers descending, take top RESULT_LIMIT
    qualified.sort(key=lambda r: r["_total_drivers_int"], reverse=True)
    sample = qualified[:RESULT_LIMIT]

    # Strip the internal sort key before saving
    for row in sample:
        row.pop("_total_drivers_int", None)

    print(f"Rows with total_drivers >= 20: {len(qualified)}")
    print(f"Saving top {len(sample)} rows.")

    # Write outputs
    out_sample = _SAMPLES / "active_20_plus_drivers.json"
    out_columns = _SAMPLES / "columns_observed.json"
    out_sample.write_text(json.dumps(sample, indent=2), encoding="utf-8")
    out_columns.write_text(json.dumps(columns_observed, indent=2), encoding="utf-8")

    print(f"\nWrote {out_sample}")
    print(f"Wrote {out_columns}")

    # Summary
    has_email = any(row.get("email_address") for row in sample)
    states = sorted(set(r.get("phy_state", "") for r in sample if r.get("phy_state")))
    print(f"\nSummary")
    print(f"  $where server-side filter worked: status_code='A' ✓")
    print(f"  $where numeric filter worked:     NO (all numeric fields are TEXT)")
    print(f"  $order server-side worked:        NO (silently caps results — sort locally)")
    print(f"  Active rows fetched:              {len(all_active)}")
    print(f"  Rows with total_drivers >= 20:    {len(qualified)}")
    print(f"  Sample saved:                     {len(sample)}")
    print(f"  email_address present:            {has_email}")
    print(f"  States in sample:                 {states}")
    print(f"  Observed columns ({len(columns_observed)}): {columns_observed}")

    if sample:
        print("\nTop 3 rows (by total_drivers):")
        for row in sample[:3]:
            print(json.dumps(row, indent=2))


if __name__ == "__main__":
    main()
