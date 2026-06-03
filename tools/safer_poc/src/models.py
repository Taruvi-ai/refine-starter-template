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

    legal_name: Optional[str]
    entity_type: Optional[str]
    usdot_status: Optional[str]
    operating_authority_status: Optional[str]
    physical_address: Optional[str]
    mailing_address: Optional[str]
    phone: Optional[str]
    power_units: Optional[int]
    drivers: Optional[int]
    operation_classification: List[str] = field(default_factory=list)
    carrier_operation: List[str] = field(default_factory=list)
    cargo_carried: List[str] = field(default_factory=list)
