from dataclasses import dataclass, field
from typing import List, Optional

# page_type values
PAGE_CARRIER = "CARRIER"
PAGE_NOT_FOUND = "NOT_FOUND"    # SAFER "Record Not Found" response
PAGE_INACTIVE = "INACTIVE"      # SAFER "Record Inactive" response


@dataclass
class CarrierSnapshot:
    # Always present — describes the SAFER response type.
    page_type: str  # PAGE_CARRIER | PAGE_NOT_FOUND | PAGE_INACTIVE

    # For PAGE_NOT_FOUND / PAGE_INACTIVE: DOT number extracted from the error
    # message (may differ from filename if SAFER strips leading zeros).
    # For PAGE_CARRIER: parsed from the snapshot table.
    usdot_number: Optional[str]

    # --- Identity / registration ---
    legal_name: Optional[str]
    dba_name: Optional[str]
    entity_type: Optional[str]
    usdot_status: Optional[str]
    mc_mx_ff_numbers: Optional[str]       # e.g. "MC-384359" or None
    state_carrier_id: Optional[str]
    duns_number: Optional[str]

    # --- Status ---
    out_of_service_date: Optional[str]    # "MM/DD/YYYY" or None
    operating_authority_status: Optional[str]

    # --- Contact / location ---
    physical_address: Optional[str]
    mailing_address: Optional[str]
    phone: Optional[str]

    # --- Fleet ---
    power_units: Optional[int]
    drivers: Optional[int]

    # --- MCS-150 filing ---
    mcs_150_form_date: Optional[str]      # "MM/DD/YYYY" or None
    mcs_150_mileage: Optional[int]        # numeric miles, year stripped
    mcs_150_mileage_year: Optional[int]   # e.g. 2025

    # --- US inspections (24-month) ---
    us_inspections_total: Optional[int]
    us_crashes_fatal: Optional[int]
    us_crashes_injury: Optional[int]
    us_crashes_tow: Optional[int]
    us_crashes_total: Optional[int]

    # --- Canada inspections (24-month) ---
    canada_inspections_total: Optional[int]
    canada_crashes_fatal: Optional[int]
    canada_crashes_injury: Optional[int]
    canada_crashes_tow: Optional[int]
    canada_crashes_total: Optional[int]

    # --- Safety rating (present only if carrier has been rated) ---
    safety_rating: Optional[str]          # "Satisfactory" / "Conditional" / "Unsatisfactory"
    safety_rating_date: Optional[str]     # "MM/DD/YYYY"
    safety_review_date: Optional[str]     # "MM/DD/YYYY"
    safety_review_type: Optional[str]     # e.g. "Non-Ratable"

    # --- Operations (checkbox lists) — must be last; they carry field() defaults ---
    operation_classification: List[str] = field(default_factory=list)
    carrier_operation: List[str] = field(default_factory=list)
    cargo_carried: List[str] = field(default_factory=list)
