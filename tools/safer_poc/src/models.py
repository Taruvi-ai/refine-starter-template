from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class CarrierSnapshot:
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
