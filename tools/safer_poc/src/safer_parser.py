"""
SAFER FMCSA company-snapshot HTML parser.

Parses saved HTML only — no network access.
"""
import re
import sys
from pathlib import Path
from typing import List, Optional, Tuple

# Allow running as a script with `python -m` from the tools/safer_poc root.
_HERE = Path(__file__).parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from models import CarrierSnapshot, PAGE_CARRIER, PAGE_INACTIVE, PAGE_NOT_FOUND


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    """Collapse whitespace, strip HTML tags and &nbsp;."""
    if not text:
        return ""
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _norm_str(raw: Optional[str]) -> Optional[str]:
    """Return None for blank / '--' / 'None' strings."""
    if raw is None:
        return None
    v = _clean(raw)
    if not v or v in ("--", "None", "N/A"):
        return None
    return v


def _norm_int(raw: Optional[str]) -> Optional[int]:
    """Convert '399,997' → 399997; return None for blank / non-numeric."""
    if raw is None:
        return None
    v = _clean(raw).replace(",", "")
    if not v or v in ("--", "None", "N/A"):
        return None
    try:
        return int(v)
    except ValueError:
        return None


def _qf(html: str, label_re: str) -> Optional[str]:
    """
    Extract the queryfield TD that immediately follows the anchor whose text
    matches *label_re* (a querylabel anchor pattern).
    """
    pat = label_re + r"</A>\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>"
    m = re.search(pat, html, re.IGNORECASE | re.DOTALL)
    return m.group(1) if m else None


def _checked_items(html: str, section_start_re: str, section_end_re: str) -> List[str]:
    """
    Extract labels from checkbox-style tables where the first TD contains 'X'.
    Scans only the HTML slice between *section_start_re* and *section_end_re*.
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


def _extract_error_dot(html: str) -> Optional[str]:
    """Pull DOT number from NOT_FOUND / INACTIVE error pages."""
    m = re.search(r"USDOT\s+Number\s*=\s*(\d+)", html, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip() if m else None


def _crash_row(html_section: str) -> Tuple[Optional[int], Optional[int], Optional[int], Optional[int]]:
    """
    Extract (fatal, injury, tow, total) from a SAFER crashes table section.
    The section should already be bounded to prevent cross-table leakage.
    """
    anchor = html_section.find(">Crashes:</A>")
    if anchor < 0:
        return None, None, None, None
    block = html_section[anchor: anchor + 900]
    tds = re.findall(r'<TD[^>]*class="queryfield"[^>]*>(\d+)</TD>', block)
    if len(tds) >= 4:
        return int(tds[0]), int(tds[1]), int(tds[2]), int(tds[3])
    return None, None, None, None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_safer_html(html: str) -> CarrierSnapshot:
    """Parse a SAFER company-snapshot HTML string and return a CarrierSnapshot."""

    # --- Detect error pages first ---

    if re.search(r"SAFER Web - Company Snapshot RECORD NOT FOUND", html, re.IGNORECASE):
        return CarrierSnapshot(
            page_type=PAGE_NOT_FOUND,
            usdot_number=_extract_error_dot(html),
            legal_name=None, dba_name=None, entity_type=None, usdot_status=None,
            mc_mx_ff_numbers=None, state_carrier_id=None, duns_number=None,
            out_of_service_date=None, operating_authority_status=None,
            physical_address=None, mailing_address=None, phone=None,
            power_units=None, drivers=None,
            mcs_150_form_date=None, mcs_150_mileage=None, mcs_150_mileage_year=None,
            us_inspections_total=None,
            us_crashes_fatal=None, us_crashes_injury=None,
            us_crashes_tow=None, us_crashes_total=None,
            canada_inspections_total=None,
            canada_crashes_fatal=None, canada_crashes_injury=None,
            canada_crashes_tow=None, canada_crashes_total=None,
            safety_rating=None, safety_rating_date=None,
            safety_review_date=None, safety_review_type=None,
            # list fields last (carry field() defaults)
        )

    if re.search(r"SAFER Web - Company Snapshot RECORD INACTIVE", html, re.IGNORECASE):
        return CarrierSnapshot(
            page_type=PAGE_INACTIVE,
            usdot_number=_extract_error_dot(html),
            legal_name=None, dba_name=None, entity_type=None, usdot_status=None,
            mc_mx_ff_numbers=None, state_carrier_id=None, duns_number=None,
            out_of_service_date=None, operating_authority_status=None,
            physical_address=None, mailing_address=None, phone=None,
            power_units=None, drivers=None,
            mcs_150_form_date=None, mcs_150_mileage=None, mcs_150_mileage_year=None,
            us_inspections_total=None,
            us_crashes_fatal=None, us_crashes_injury=None,
            us_crashes_tow=None, us_crashes_total=None,
            canada_inspections_total=None,
            canada_crashes_fatal=None, canada_crashes_injury=None,
            canada_crashes_tow=None, canada_crashes_total=None,
            safety_rating=None, safety_rating_date=None,
            safety_review_date=None, safety_review_type=None,
            # list fields last (carry field() defaults)
        )

    # --- Normal carrier snapshot ---

    # Partition US and Canada sections to avoid cross-section leakage.
    ca_anchor = html.find('name="CAInspections"')
    us_html = html[:ca_anchor] if ca_anchor > 0 else html
    ca_html = html[ca_anchor:] if ca_anchor > 0 else ""

    # Identity
    usdot_number = _norm_str(_qf(html, r"USDOT\s*Number:"))
    legal_name = _norm_str(_qf(html, r"Legal\s*Name:"))
    dba_name = _norm_str(_qf(html, r"DBA Name:"))
    entity_type = _norm_str(_qf(html, r"Entity\s*Type:"))
    usdot_status = _norm_str(_qf(html, r"USDOT\s*Status:"))
    mc_mx_ff_numbers = _norm_str(_qf(html, r"MC/MX/FF Number\(s\):"))
    state_carrier_id = _norm_str(_qf(html, r"State Carrier ID Number:"))
    duns_number = _norm_str(_qf(html, r"DUNS Number:"))
    out_of_service_date = _norm_str(_qf(html, r"Out of Service Date:"))

    # Operating Authority Status — strip trailing footnote text
    oa_raw = _qf(html, r"Operating\s*Authority\s*Status:")
    operating_authority_status: Optional[str] = None
    if oa_raw:
        val = _clean(oa_raw)
        status_m = re.match(
            r"((?:NOT\s+)?AUTHORIZED(?:\s+FOR\s+\w+(?:,\s*\w+)*)?|OUT-OF-SERVICE)",
            val, re.IGNORECASE,
        )
        operating_authority_status = (
            status_m.group(0).strip() if status_m else (_norm_str(val) if val else None)
        )

    # Contact / location
    physical_address = _norm_str(_qf(html, r"Physical\s*Address:"))
    mailing_address = _norm_str(_qf(html, r"Mailing\s*Address:"))
    phone = _norm_str(_qf(html, r"Phone:"))

    # Fleet
    power_units = _norm_int(_qf(html, r"Power\s*Units:"))
    # Drivers uses a non-standard TD (no class="queryfield") with FONT color tag
    m = re.search(r"Drivers:</A>\s*</TH>\s*<TD[^>]*>(.*?)</TD>", html, re.IGNORECASE | re.DOTALL)
    drivers = _norm_int(m.group(1) if m else None)

    # MCS-150 filing
    mcs_150_form_date = _norm_str(_qf(html, r"MCS-150 Form Date:"))
    # Mileage uses a different TD format: <TD valign=top><FONT ...><B>17,561,354 (2025)
    mcs_150_mileage: Optional[int] = None
    mcs_150_mileage_year: Optional[int] = None
    mileage_m = re.search(
        r'MCS-150 Mileage \(Year\):</A></TH>\s*<TD[^>]*>.*?<B>([\d,]+)\s*\((\d{4})\)',
        html, re.IGNORECASE | re.DOTALL,
    )
    if mileage_m:
        mcs_150_mileage = _norm_int(mileage_m.group(1))
        mcs_150_mileage_year = _norm_int(mileage_m.group(2))

    # Operations (checkbox lists)
    operation_classification = _checked_items(
        html,
        r"Operation\s*Classification:</A>",
        r"<!--\s*BEGIN:\s*Carrier\s*Operation",
    )
    carrier_operation = _checked_items(
        html,
        r"Carrier\s*Operation:</A>",
        r"<!--\s*BEGIN:\s*(?:Shipper|Cargo)",
    )
    cargo_carried = _checked_items(
        html,
        r"Cargo\s*Carried:</A>",
        r"<!--\s*BEGIN:|</TABLE>\s*</CENTER>",
    )

    # US inspections total
    us_insp_m = re.search(
        r"Total Inspections:\s*<FONT[^>]*>\s*(\d+)\s*</FONT>",
        us_html, re.IGNORECASE,
    )
    us_inspections_total = int(us_insp_m.group(1)) if us_insp_m else None

    # US crashes
    us_cf, us_ci, us_ct, us_ctotal = _crash_row(us_html)

    # Canada inspections total
    ca_insp_m = re.search(
        r"Total inspections:\s*<FONT[^>]*>\s*(\d+)\s*</FONT>",
        ca_html, re.IGNORECASE,
    )
    canada_inspections_total = int(ca_insp_m.group(1)) if ca_insp_m else None

    # Canada crashes
    ca_cf, ca_ci, ca_ct, ca_ctotal = _crash_row(ca_html)

    # Safety rating — lives in its own table after the "Carrier Safety Rating:" label
    idx = html.lower().find("carrier safety rating:")
    safety_block = html[idx: idx + 1200] if idx >= 0 else ""
    safety_rating = _norm_str(
        _first_qf_in_block(safety_block, r"Rating:") if safety_block else None
    )
    safety_rating_date = _norm_str(
        _first_qf_in_block(safety_block, r"Rating Date:") if safety_block else None
    )
    safety_review_date = _norm_str(
        _first_qf_in_block(safety_block, r"Review Date:") if safety_block else None
    )
    safety_review_type = _norm_str(
        _first_qf_in_block(safety_block, r"Type:") if safety_block else None
    )

    return CarrierSnapshot(
        page_type=PAGE_CARRIER,
        usdot_number=usdot_number,
        legal_name=legal_name,
        dba_name=dba_name,
        entity_type=entity_type,
        usdot_status=usdot_status,
        mc_mx_ff_numbers=mc_mx_ff_numbers,
        state_carrier_id=state_carrier_id,
        duns_number=duns_number,
        out_of_service_date=out_of_service_date,
        operating_authority_status=operating_authority_status,
        physical_address=physical_address,
        mailing_address=mailing_address,
        phone=phone,
        power_units=power_units,
        drivers=drivers,
        mcs_150_form_date=mcs_150_form_date,
        mcs_150_mileage=mcs_150_mileage,
        mcs_150_mileage_year=mcs_150_mileage_year,
        operation_classification=operation_classification,
        carrier_operation=carrier_operation,
        cargo_carried=cargo_carried,
        us_inspections_total=us_inspections_total,
        us_crashes_fatal=us_cf,
        us_crashes_injury=us_ci,
        us_crashes_tow=us_ct,
        us_crashes_total=us_ctotal,
        canada_inspections_total=canada_inspections_total,
        canada_crashes_fatal=ca_cf,
        canada_crashes_injury=ca_ci,
        canada_crashes_tow=ca_ct,
        canada_crashes_total=ca_ctotal,
        safety_rating=safety_rating,
        safety_rating_date=safety_rating_date,
        safety_review_date=safety_review_date,
        safety_review_type=safety_review_type,
    )


def _first_qf_in_block(block: str, label_re: str) -> Optional[str]:
    """
    Extract the first queryfield TD following a querylabelbkg TH whose text
    matches *label_re* (used for the safety-rating sub-table which uses
    querylabelbkg instead of querylabel anchors).
    """
    pat = label_re + r"\s*</TH>\s*<TD[^>]*class=\"queryfield\"[^>]*>(.*?)</TD>"
    m = re.search(pat, block, re.IGNORECASE | re.DOTALL)
    return m.group(1) if m else None
