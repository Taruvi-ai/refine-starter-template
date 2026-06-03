"""
FMCSA Company Census → Taruvi Platform ingestion script.

Fetches active carriers from the Socrata endpoint, filters locally for
total_drivers >= MIN_DRIVERS, then upserts into the Platform DataTables:
  - carriers               (upsert key: usdot_number)
  - carrier_census_snapshots (insert: one row per census fetch event)
  - carrier_ingestion_runs   (create on start, update on finish)

Usage (from repo root or tools/company_census_poc/):
    python tools/company_census_poc/scripts/ingest_to_platform.py [options]

Options:
    --limit N         Rows to fetch from Socrata (default 500)
    --offset N        Socrata $offset (default 0)
    --min-drivers N   Local minimum drivers filter (default 20)
    --dry-run         Fetch + transform but do not write to Platform

Requirements:
    pip install requests python-dotenv    (requests already installed)
    .env at repo root with TARUVI_SITE_URL, TARUVI_API_KEY, TARUVI_APP_SLUG

API strategy:
    The Taruvi REST upsert endpoint format is not publicly documented; the
    upsert MCP tool uses an internal wrapper. This script uses a reliable
    query-first pattern:
      1. Batch-GET existing carriers by usdot_number.
      2. Route each qualifying row to POST (new) or PATCH (update).
    This is safe, transparent, and works with the confirmed REST surface.
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
import uuid
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("ERROR: requests not installed.  pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CENSUS_URL = "https://data.transportation.gov/resource/az4n-8mr2.json"

CENSUS_FIELDS = ",".join([
    "dot_number", "legal_name", "dba_name",
    "phy_street", "phy_city", "phy_state", "phy_zip", "phy_country",
    "carrier_mailing_street", "carrier_mailing_city",
    "carrier_mailing_state", "carrier_mailing_zip",
    "phone", "email_address",
    "power_units", "total_drivers", "status_code",
    "carrier_operation", "classdef",
    "mcs150_date", "mcs150_mileage", "mcs150_mileage_year",
    "business_org_desc", "hm_ind", "crgo_genfreight", "add_date",
])

# Resolve .env from repo root (three levels up from scripts/)
_REPO_ROOT = Path(__file__).resolve().parents[3]
_ENV_FILE = _REPO_ROOT / ".env"


def _load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if _ENV_FILE.exists():
        for line in _ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


# ---------------------------------------------------------------------------
# Taruvi REST client helpers
# ---------------------------------------------------------------------------

class TaruviClient:
    def __init__(self, site_url: str, api_key: str, app_slug: str) -> None:
        self.base = site_url.rstrip("/")
        self.app_slug = app_slug
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Api-Key {api_key}",
            "X-App-Slug": app_slug,
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    def _url(self, table: str, record_id: str = "") -> str:
        path = f"/api/apps/{self.app_slug}/datatables/{table}/data"
        if record_id:
            path += f"/{record_id}/"
        return self.base + path

    def get_all(self, table: str, page_size: int = 100) -> list[dict]:
        """Fetch all rows from a table using page/page_size pagination."""
        results: list[dict] = []
        page = 1
        while True:
            params = {"page_size": page_size, "page": page}
            resp = self.session.get(self._url(table), params=params, timeout=30)
            resp.raise_for_status()
            body = resp.json()
            if body.get("status") != "success":
                raise RuntimeError(f"GET {table} failed: {body.get('message')}")
            rows = body.get("data", [])
            results.extend(rows)
            total = body.get("total", 0)
            if len(results) >= total or not rows:
                break
            page += 1
        return results

    def post(self, table: str, record: dict) -> dict:
        """Insert a single record. Returns the created record."""
        resp = self.session.post(self._url(table), json=record, timeout=30)
        body = resp.json()
        if body.get("status") != "success":
            raise RuntimeError(f"POST {table} failed: {body.get('detail', body.get('message'))}")
        data = body.get("data", {})
        # Platform returns a list even for single-record POSTs
        if isinstance(data, list):
            return data[0] if data else {}
        return data

    def patch(self, table: str, record_id: str, fields: dict) -> dict:
        """Partial-update a single record by id."""
        resp = self.session.patch(
            self._url(table, record_id),
            json=fields,
            timeout=30,
        )
        body = resp.json()
        if body.get("status") != "success":
            raise RuntimeError(f"PATCH {table}/{record_id} failed: {body.get('detail', body.get('message'))}")
        return body.get("data", {})


# ---------------------------------------------------------------------------
# Census fetch
# ---------------------------------------------------------------------------

def fetch_census(limit: int, offset: int) -> list[dict]:
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    params = {
        "$limit": limit,
        "$offset": offset,
        "$select": CENSUS_FIELDS,
        "$where": "status_code='A'",
    }
    resp = session.get(CENSUS_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

def _int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(str(v).replace(",", ""))
    except (ValueError, TypeError):
        return None


def _str(v: Any) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def census_row_to_carrier(row: dict, now_iso: str) -> dict:
    """Map a raw census API row to a carriers table record."""
    return {
        "id": str(uuid.uuid4()),
        "usdot_number": _str(row.get("dot_number")),
        "legal_name": _str(row.get("legal_name")),
        "dba_name": _str(row.get("dba_name")),
        "census_status": _str(row.get("status_code")),
        "phy_street": _str(row.get("phy_street")),
        "phy_city": _str(row.get("phy_city")),
        "phy_state": _str(row.get("phy_state")),
        "phy_zip": _str(row.get("phy_zip")),
        "mailing_street": _str(row.get("carrier_mailing_street")),
        "mailing_city": _str(row.get("carrier_mailing_city")),
        "mailing_state": _str(row.get("carrier_mailing_state")),
        "mailing_zip": _str(row.get("carrier_mailing_zip")),
        "phone": _str(row.get("phone")),
        "email": _str(row.get("email_address")),
        "power_units": _int(row.get("power_units")),
        "drivers": _int(row.get("total_drivers")),
        "business_org_type": _str(row.get("business_org_desc")),
        "hm_ind": _str(row.get("hm_ind")),
        "carrier_operation_code": _str(row.get("carrier_operation")),
        "classdef": _str(row.get("classdef")),
        "crgo_genfreight": _str(row.get("crgo_genfreight")),
        "mcs150_date": _str(row.get("mcs150_date")),
        "mcs150_mileage": _int(row.get("mcs150_mileage")),
        "mcs150_mileage_year": _int(row.get("mcs150_mileage_year")),
        "census_add_date": _str(row.get("add_date")),
        "safer_enriched": False,
        "census_fetched_at": now_iso,
        "created_at": now_iso,
        "updated_at": now_iso,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Ingest FMCSA Company Census into Taruvi Platform")
    p.add_argument("--limit", type=int, default=500, help="Socrata $limit (rows to fetch)")
    p.add_argument("--offset", type=int, default=0, help="Socrata $offset")
    p.add_argument("--min-drivers", type=int, default=20, dest="min_drivers",
                   help="Local minimum total_drivers filter")
    p.add_argument("--dry-run", action="store_true", dest="dry_run",
                   help="Fetch and transform, but do not write to Platform")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    env = _load_env()

    site_url = env.get("TARUVI_SITE_URL")
    api_key = env.get("TARUVI_API_KEY")
    app_slug = env.get("TARUVI_APP_SLUG")

    if not all([site_url, api_key, app_slug]):
        print("ERROR: TARUVI_SITE_URL, TARUVI_API_KEY, and TARUVI_APP_SLUG must be set in .env")
        sys.exit(1)

    now_iso = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    run_id = str(uuid.uuid4())

    client = TaruviClient(site_url, api_key, app_slug)

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Carrier Sales Intelligence — Company Census Ingestion")
    print(f"  Socrata limit={args.limit}  offset={args.offset}  min_drivers={args.min_drivers}")
    print()

    # -----------------------------------------------------------------------
    # 1. Create ingestion run record
    # -----------------------------------------------------------------------
    run_record = {
        "id": run_id,
        "run_type": "census_sync",
        "status": "running",
        "started_at": now_iso,
        "created_at": now_iso,
    }

    if not args.dry_run:
        try:
            client.post("carrier_ingestion_runs", run_record)
            print(f"Created ingestion run  id={run_id}")
        except Exception as e:
            print(f"ERROR: Could not create ingestion run: {e}")
            sys.exit(1)
    else:
        print(f"[DRY RUN] Would create ingestion run  id={run_id}")

    total_fetched = total_qualified = total_inserted = total_updated = 0
    total_skipped = total_errors = 0
    error_details: list[str] = []

    try:
        # -------------------------------------------------------------------
        # 2. Fetch from Census API
        # -------------------------------------------------------------------
        print(f"\nFetching from Socrata (limit={args.limit}, offset={args.offset})…")
        raw_rows = fetch_census(args.limit, args.offset)
        total_fetched = len(raw_rows)
        print(f"  Fetched: {total_fetched} active rows")

        # -------------------------------------------------------------------
        # 3. Local filter: total_drivers >= min_drivers
        # -------------------------------------------------------------------
        qualified = []
        for row in raw_rows:
            d = _int(row.get("total_drivers")) or 0
            if d >= args.min_drivers:
                qualified.append(row)
            else:
                total_skipped += 1
        total_qualified = len(qualified)
        print(f"  Qualified (drivers >= {args.min_drivers}): {total_qualified}")
        print(f"  Skipped (below threshold): {total_skipped}")

        if not qualified:
            print("\nNothing to ingest.")
            _finish_run(client, run_id, now_iso, "completed",
                        total_fetched, 0, 0, total_skipped, 0, None, args.dry_run)
            return

        # -------------------------------------------------------------------
        # 4. Batch-look up existing carriers by usdot_number
        # -------------------------------------------------------------------
        dot_numbers = [_str(r.get("dot_number")) for r in qualified if r.get("dot_number")]
        existing_map: dict[str, str] = {}  # usdot_number → carrier id

        if not args.dry_run:
            print(f"\nLooking up existing carriers (fetching all, then matching {len(dot_numbers)} DOTs)…")
            all_carriers = client.get_all("carriers")
            dot_set = set(dot_numbers)
            existing_map = {
                r["usdot_number"]: r["id"]
                for r in all_carriers
                if r.get("usdot_number") in dot_set
            }
            print(f"  Carriers in platform: {len(all_carriers)}  matched: {len(existing_map)}  new: {len(dot_numbers) - len(existing_map)}")
        else:
            print(f"\n[DRY RUN] Would look up {len(dot_numbers)} DOT numbers")

        # -------------------------------------------------------------------
        # 5. Upsert carriers + insert census snapshots
        # -------------------------------------------------------------------
        print("\nIngesting qualified rows…")
        snapshot_rows: list[dict] = []

        for i, row in enumerate(qualified, 1):
            usdot = _str(row.get("dot_number"))
            carrier_rec = census_row_to_carrier(row, now_iso)

            snapshot = {
                "id": str(uuid.uuid4()),
                "usdot_number": usdot,
                "raw_json": row,
                "fetched_at": now_iso,
                "ingest_status": "pending",
                "created_at": now_iso,
            }

            if args.dry_run:
                action = "UPDATE" if usdot in existing_map else "INSERT"
                print(f"  [{i:3d}] {action:6s}  DOT {usdot:>10}  {_str(row.get('legal_name')) or ''}")
                continue

            try:
                if usdot in existing_map:
                    # Update existing carrier — exclude id and created_at (immutable after insert)
                    update_fields = {
                        k: v for k, v in carrier_rec.items()
                        if k not in ("id", "created_at")
                    }
                    carrier_id = existing_map[usdot]
                    client.patch("carriers", carrier_id, update_fields)
                    snapshot["carrier_id"] = carrier_id
                    snapshot["ingest_status"] = "ingested"
                    total_updated += 1
                    print(f"  [{i:3d}] UPDATE  DOT {usdot:>10}  {carrier_rec.get('legal_name') or ''}")
                else:
                    result = client.post("carriers", carrier_rec)
                    carrier_id = result.get("id", carrier_rec["id"])
                    snapshot["carrier_id"] = carrier_id
                    snapshot["ingest_status"] = "ingested"
                    total_inserted += 1
                    print(f"  [{i:3d}] INSERT  DOT {usdot:>10}  {carrier_rec.get('legal_name') or ''}")

                snapshot_rows.append(snapshot)

            except Exception as e:
                err = f"DOT {usdot}: {e}"
                error_details.append(err)
                total_errors += 1
                snapshot["ingest_status"] = "error"
                snapshot["ingest_error"] = str(e)[:500]
                snapshot_rows.append(snapshot)
                print(f"  [{i:3d}] ERROR   DOT {usdot}: {e}")

        # -------------------------------------------------------------------
        # 6. Bulk-insert census snapshots
        # -------------------------------------------------------------------
        if snapshot_rows and not args.dry_run:
            print(f"\nInserting {len(snapshot_rows)} census snapshot rows…")
            snap_ok = snap_err = 0
            for snap in snapshot_rows:
                try:
                    client.post("carrier_census_snapshots", snap)
                    snap_ok += 1
                except Exception as e:
                    snap_err += 1
                    print(f"  WARN: snapshot insert failed for {snap.get('usdot_number')}: {e}")
            print(f"  Snapshots inserted: {snap_ok}  errors: {snap_err}")

    except Exception as exc:
        # Unhandled failure — mark run as failed and re-raise summary
        err_msg = str(exc)
        print(f"\nFATAL ERROR: {err_msg}")
        _finish_run(client, run_id, now_iso, "failed",
                    total_fetched, total_inserted, total_updated,
                    total_skipped, total_errors + 1, err_msg, args.dry_run)
        sys.exit(1)

    # -----------------------------------------------------------------------
    # 7. Finalise ingestion run
    # -----------------------------------------------------------------------
    status = "failed" if total_errors else "completed"
    _finish_run(
        client, run_id, now_iso, status,
        total_fetched, total_inserted, total_updated,
        total_skipped, total_errors,
        "; ".join(error_details) if error_details else None,
        args.dry_run,
    )

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Done.")
    print(f"  run_id:          {run_id}")
    print(f"  status:          {status}")
    print(f"  total_fetched:   {total_fetched}")
    print(f"  qualified:       {total_qualified}")
    print(f"  inserted:        {total_inserted}")
    print(f"  updated:         {total_updated}")
    print(f"  skipped:         {total_skipped}")
    print(f"  errors:          {total_errors}")


def _finish_run(
    client: TaruviClient,
    run_id: str,
    started_at: str,
    status: str,
    total_fetched: int,
    total_inserted: int,
    total_updated: int,
    total_skipped: int,
    total_errors: int,
    error_details: str | None,
    dry_run: bool,
) -> None:
    completed_at = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    fields: dict[str, Any] = {
        "status": status,
        "total_fetched": total_fetched,
        "total_inserted": total_inserted,
        "total_updated": total_updated,
        "total_skipped": total_skipped,
        "total_errors": total_errors,
        "completed_at": completed_at,
    }
    if error_details:
        fields["error_details"] = error_details[:2000]

    if not dry_run:
        try:
            client.patch("carrier_ingestion_runs", run_id, fields)
            print(f"\nIngestion run {run_id} → {status}")
        except Exception as e:
            print(f"\nWARN: Could not update ingestion run {run_id}: {e}")
    else:
        print(f"\n[DRY RUN] Would update ingestion run → {status}  fetched={total_fetched}  inserted={total_inserted}  updated={total_updated}")


if __name__ == "__main__":
    main()
