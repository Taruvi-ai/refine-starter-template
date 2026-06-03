"""
SAFER FMCSA company-snapshot HTML parser.

Parses saved HTML only — no network access.
"""
import re
import sys
from pathlib import Path
from typing import List, Optional

# Allow running as a script with `python -m` from the tools/safer_poc root.
_HERE = Path(__file__).parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from models import CarrierSnapshot


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    """Collapse whitespace and strip embedded HTML tags / &nbsp;."""
    if not text:
        return ""
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _norm_str(raw: Optional[str]) -> Optional[str]:
    """Return None for blank/missing strings."""
    if raw is None:
        return None
    cleaned = _clean(raw)
    return cleaned if cleaned else None


def _norm_int(raw: Optional[str]) -> Optional[int]:
    """Convert numeric strings like '399,997' to int; return None for blank."""
    if raw is None:
        return None
    cleaned = _clean(raw).replace(",", "")
    if not cleaned:
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None


def _field(html: str, label_re: str) -> Optional[str]:
    """
    Extract the queryfield TD that immediately follows a querylabel TH whose
    anchor text matches *label_re*.
    """
    pat = label_re + r"</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>"
    m = re.search(pat, html, re.IGNORECASE | re.DOTALL)
    return m.group(1) if m else None


def _checked_items(html: str, section_start_re: str, section_end_re: str) -> List[str]:
    """
    Extract labels from checkbox-style tables where the first TD contains 'X'.
    Scans only the slice of HTML between *section_start_re* and *section_end_re*.
    """
    start_m = re.search(section_start_re, html, re.IGNORECASE | re.DOTALL)
    if not start_m:
        return []

    tail = html[start_m.end():]
    end_m = re.search(section_end_re, tail, re.IGNORECASE | re.DOTALL)
    section = tail[: end_m.start()] if end_m else tail[:5000]

    items = []
    row_pat = r'<TD[^>]*class="queryfield"[^>]*>\s*X\s*</TD>\s*<TD[^>]*>.*?>(.*?)</FONT>'
    for m in re.finditer(row_pat, section, re.IGNORECASE | re.DOTALL):
        label = _clean(m.group(1))
        if label:
            items.append(label)
    return items


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_safer_html(html: str) -> CarrierSnapshot:
    """Parse a SAFER company-snapshot HTML string and return a CarrierSnapshot."""

    # USDOT Number
    m = re.search(
        r"USDOT\s*Number:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    usdot_number = _norm_str(m.group(1) if m else None)

    # Legal Name
    m = re.search(
        r"Legal\s*Name:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    legal_name = _norm_str(m.group(1) if m else None)

    # Entity Type
    m = re.search(
        r"Entity\s*Type:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    entity_type = _norm_str(m.group(1) if m else None)

    # USDOT Status
    m = re.search(
        r"USDOT\s*Status:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    usdot_status = _norm_str(m.group(1) if m else None)

    # Operating Authority Status — strip trailing footnote text
    m = re.search(
        r"Operating\s*Authority\s*Status:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    operating_authority_status: Optional[str] = None
    if m:
        val = _clean(m.group(1))
        status_m = re.match(
            r"((?:NOT\s+)?AUTHORIZED(?:\s+FOR\s+\w+(?:,\s*\w+)*)?|OUT-OF-SERVICE)",
            val, re.IGNORECASE,
        )
        operating_authority_status = status_m.group(0).strip() if status_m else (_norm_str(val) if val else None)

    # Physical Address
    m = re.search(
        r"Physical\s*Address:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    physical_address = _norm_str(m.group(1) if m else None)

    # Mailing Address
    m = re.search(
        r"Mailing\s*Address:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    mailing_address = _norm_str(m.group(1) if m else None)

    # Phone
    m = re.search(
        r"Phone:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    phone = _norm_str(m.group(1) if m else None)

    # Power Units (numeric)
    m = re.search(
        r"Power\s*Units:</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    power_units = _norm_int(m.group(1) if m else None)

    # Drivers (numeric; may use FONT tag)
    m = re.search(
        r"Drivers:</A>\s*</TH>\s*<TD[^>]*>(.*?)</TD>",
        html, re.IGNORECASE | re.DOTALL,
    )
    drivers = _norm_int(m.group(1) if m else None)

    # Operation Classification (checkboxes)
    operation_classification = _checked_items(
        html,
        r"Operation\s*Classification:</A>",
        r"<!--\s*BEGIN:\s*Carrier\s*Operation",
    )

    # Carrier Operation (checkboxes)
    carrier_operation = _checked_items(
        html,
        r"Carrier\s*Operation:</A>",
        r"<!--\s*BEGIN:\s*(?:Shipper|Cargo)",
    )

    # Cargo Carried (checkboxes)
    cargo_carried = _checked_items(
        html,
        r"Cargo\s*Carried:</A>",
        r"<!--\s*BEGIN:|</TABLE>\s*</CENTER>",
    )

    return CarrierSnapshot(
        usdot_number=usdot_number,
        legal_name=legal_name,
        entity_type=entity_type,
        usdot_status=usdot_status,
        operating_authority_status=operating_authority_status,
        physical_address=physical_address,
        mailing_address=mailing_address,
        phone=phone,
        power_units=power_units,
        drivers=drivers,
        operation_classification=operation_classification,
        carrier_operation=carrier_operation,
        cargo_carried=cargo_carried,
    )
