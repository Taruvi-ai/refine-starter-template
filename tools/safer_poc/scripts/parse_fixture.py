"""
Read a saved SAFER HTML fixture and write parsed JSON.

Usage (from tools/safer_poc/):
    python scripts/parse_fixture.py [<html_path> [<json_out_path>]]

Defaults:
    html_path  → raw_html/usdot_<dot>.html  (first file found)
    json_out   → parsed/<stem>.json
"""
import dataclasses
import json
import sys
from pathlib import Path

# Resolve src/ regardless of where the script is called from.
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "src"))

from safer_parser import parse_safer_html


def main() -> None:
    args = sys.argv[1:]

    if args:
        html_path = Path(args[0])
    else:
        candidates = sorted((_ROOT / "raw_html").glob("*.html"))
        if not candidates:
            print("ERROR: no HTML files found in raw_html/", file=sys.stderr)
            sys.exit(1)
        html_path = candidates[0]

    if not html_path.exists():
        print(f"ERROR: not found: {html_path}", file=sys.stderr)
        sys.exit(1)

    if len(args) >= 2:
        out_path = Path(args[1])
    else:
        out_path = _ROOT / "parsed" / (html_path.stem + ".json")

    html = html_path.read_text(encoding="utf-8", errors="replace")
    print(f"Read {len(html):,} bytes from {html_path}")

    snapshot = parse_safer_html(html)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = dataclasses.asdict(snapshot)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(f"Wrote {out_path}")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
