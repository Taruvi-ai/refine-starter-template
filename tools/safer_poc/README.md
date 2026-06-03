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
  raw_html/          # saved SAFER HTML responses (gitignored if large)
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
pytest tests/
```

## Scope

This is a **POC / tooling area only**.

- Not the Stephen-facing UI.
- Not connected to any Taruvi Platform app, DataTable, or schema yet.
- Live SAFER fetching is handled separately on RDC and is outside this directory.
