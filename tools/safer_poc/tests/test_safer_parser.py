"""
Tests for safer_parser against saved SAFER HTML fixtures.

Fixtures
--------
usdot_2874852  — valid carrier; no DBA, no MC#, no mileage, no rating; 0 US inspections
usdot_154740   — valid carrier; DBA "RAIN FOR RENT", MC-384359, mileage, rating=Satisfactory
usdot_359711   — valid carrier; no DBA, no MC#, DUNS present, mileage, crash data
usdot_3960415  — valid carrier; DBA "FRONTIER", no MC#, mileage, crash data
usdot_073847   — RECORD NOT FOUND (SAFER strips leading zero → "73847")
usdot_2844767  — RECORD INACTIVE
"""
import sys
from pathlib import Path

import pytest

_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "src"))

from models import PAGE_CARRIER, PAGE_INACTIVE, PAGE_NOT_FOUND
from safer_parser import parse_safer_html

FIXTURES = _ROOT / "tests" / "fixtures"


def _load(dot: str):
    html = (FIXTURES / f"usdot_{dot}.html").read_text(encoding="utf-8", errors="replace")
    return parse_safer_html(html)


# ===========================================================================
# usdot_2874852 — ALL PURPOSE HANDY HELPERS (baseline numeric-normalization)
# ===========================================================================

@pytest.fixture(scope="module")
def snap_2874852():
    return _load("2874852")

def test_2874852_page_type(snap_2874852):
    assert snap_2874852.page_type == PAGE_CARRIER

def test_2874852_usdot_number(snap_2874852):
    assert snap_2874852.usdot_number == "2874852"

def test_2874852_legal_name(snap_2874852):
    assert snap_2874852.legal_name == "ALL PURPOSE HANDY HELPERS"

def test_2874852_dba_name_none(snap_2874852):
    assert snap_2874852.dba_name is None

def test_2874852_entity_type(snap_2874852):
    assert snap_2874852.entity_type == "CARRIER"

def test_2874852_usdot_status(snap_2874852):
    assert snap_2874852.usdot_status == "ACTIVE"

def test_2874852_mc_number_none(snap_2874852):
    assert snap_2874852.mc_mx_ff_numbers is None

def test_2874852_duns_none(snap_2874852):
    assert snap_2874852.duns_number is None

def test_2874852_operating_authority_status(snap_2874852):
    assert snap_2874852.operating_authority_status == "NOT AUTHORIZED"

def test_2874852_phone(snap_2874852):
    assert snap_2874852.phone == "(713) 377-2124"

def test_2874852_power_units(snap_2874852):
    assert snap_2874852.power_units == 399997

def test_2874852_drivers(snap_2874852):
    assert snap_2874852.drivers == 12

def test_2874852_mcs_150_form_date(snap_2874852):
    assert snap_2874852.mcs_150_form_date == "04/06/2016"

def test_2874852_mcs_150_mileage_none(snap_2874852):
    # This carrier has no mileage on file
    assert snap_2874852.mcs_150_mileage is None
    assert snap_2874852.mcs_150_mileage_year is None

def test_2874852_us_inspections_zero(snap_2874852):
    assert snap_2874852.us_inspections_total == 0

def test_2874852_us_crashes_zero(snap_2874852):
    assert snap_2874852.us_crashes_total == 0
    assert snap_2874852.us_crashes_fatal == 0

def test_2874852_canada_inspections_zero(snap_2874852):
    assert snap_2874852.canada_inspections_total == 0

def test_2874852_canada_crashes_zero(snap_2874852):
    assert snap_2874852.canada_crashes_total == 0

def test_2874852_safety_rating_none(snap_2874852):
    # No safety rating on record for this carrier
    assert snap_2874852.safety_rating is None
    assert snap_2874852.safety_rating_date is None
    assert snap_2874852.safety_review_date is None
    assert snap_2874852.safety_review_type is None

def test_2874852_operation_classification(snap_2874852):
    assert "Private(Property)" in snap_2874852.operation_classification

def test_2874852_carrier_operation(snap_2874852):
    assert "Intrastate Only (Non-HM)" in snap_2874852.carrier_operation

def test_2874852_cargo_carried(snap_2874852):
    assert "General Freight" in snap_2874852.cargo_carried

def test_2874852_no_blank_strings(snap_2874852):
    for val in [snap_2874852.usdot_number, snap_2874852.legal_name,
                snap_2874852.entity_type, snap_2874852.usdot_status,
                snap_2874852.operating_authority_status, snap_2874852.phone]:
        assert val != ""


# ===========================================================================
# usdot_154740 — WESTERN OILFIELDS SUPPLY CO / RAIN FOR RENT
# ===========================================================================

@pytest.fixture(scope="module")
def snap_154740():
    return _load("154740")

def test_154740_page_type(snap_154740):
    assert snap_154740.page_type == PAGE_CARRIER

def test_154740_usdot_number(snap_154740):
    assert snap_154740.usdot_number == "154740"

def test_154740_legal_name(snap_154740):
    assert snap_154740.legal_name == "WESTERN OILFIELDS SUPPLY CO"

def test_154740_dba_name(snap_154740):
    assert snap_154740.dba_name == "RAIN FOR RENT"

def test_154740_mc_number(snap_154740):
    assert snap_154740.mc_mx_ff_numbers == "MC-384359"

def test_154740_duns_none(snap_154740):
    # "--" normalises to None
    assert snap_154740.duns_number is None

def test_154740_usdot_status(snap_154740):
    assert snap_154740.usdot_status == "ACTIVE"

def test_154740_power_units_int(snap_154740):
    assert isinstance(snap_154740.power_units, int)
    assert snap_154740.power_units == 1139

def test_154740_drivers_int(snap_154740):
    assert isinstance(snap_154740.drivers, int)
    assert snap_154740.drivers == 1146

def test_154740_mcs_150_form_date(snap_154740):
    assert snap_154740.mcs_150_form_date == "05/18/2026"

def test_154740_mcs_150_mileage(snap_154740):
    assert snap_154740.mcs_150_mileage == 17561354
    assert snap_154740.mcs_150_mileage_year == 2025

def test_154740_us_inspections(snap_154740):
    assert snap_154740.us_inspections_total == 315

def test_154740_us_crashes(snap_154740):
    assert snap_154740.us_crashes_fatal == 0
    assert snap_154740.us_crashes_injury == 3
    assert snap_154740.us_crashes_tow == 8
    assert snap_154740.us_crashes_total == 11

def test_154740_canada_inspections_zero(snap_154740):
    assert snap_154740.canada_inspections_total == 0

def test_154740_canada_crashes_zero(snap_154740):
    assert snap_154740.canada_crashes_total == 0

def test_154740_safety_rating(snap_154740):
    assert snap_154740.safety_rating == "Satisfactory"

def test_154740_safety_rating_date(snap_154740):
    assert snap_154740.safety_rating_date == "07/09/1992"

def test_154740_safety_review_date(snap_154740):
    assert snap_154740.safety_review_date == "07/25/2025"

def test_154740_safety_review_type(snap_154740):
    assert snap_154740.safety_review_type == "Non-Ratable"

def test_154740_operation_classification(snap_154740):
    assert "Auth. For Hire" in snap_154740.operation_classification
    assert "Private(Property)" in snap_154740.operation_classification

def test_154740_carrier_operation(snap_154740):
    assert "Interstate" in snap_154740.carrier_operation


# ===========================================================================
# usdot_359711 — KENTUCKY UTILITIES (DUNS present, crash data)
# ===========================================================================

@pytest.fixture(scope="module")
def snap_359711():
    return _load("359711")

def test_359711_page_type(snap_359711):
    assert snap_359711.page_type == PAGE_CARRIER

def test_359711_usdot_number(snap_359711):
    assert snap_359711.usdot_number == "359711"

def test_359711_legal_name(snap_359711):
    assert snap_359711.legal_name == "KENTUCKY UTILITIES"

def test_359711_dba_name_none(snap_359711):
    assert snap_359711.dba_name is None

def test_359711_duns(snap_359711):
    assert snap_359711.duns_number == "69-449-38"

def test_359711_usdot_status(snap_359711):
    assert snap_359711.usdot_status == "ACTIVE"

def test_359711_power_units_int(snap_359711):
    assert isinstance(snap_359711.power_units, int)
    assert snap_359711.power_units == 280

def test_359711_drivers_int(snap_359711):
    assert isinstance(snap_359711.drivers, int)
    assert snap_359711.drivers == 285

def test_359711_mcs_150_mileage(snap_359711):
    assert snap_359711.mcs_150_mileage == 3619888
    assert snap_359711.mcs_150_mileage_year == 2025

def test_359711_us_inspections(snap_359711):
    assert snap_359711.us_inspections_total == 17

def test_359711_us_crashes(snap_359711):
    assert snap_359711.us_crashes_fatal == 1
    assert snap_359711.us_crashes_injury == 0
    assert snap_359711.us_crashes_tow == 2
    assert snap_359711.us_crashes_total == 3

def test_359711_safety_rating_none(snap_359711):
    assert snap_359711.safety_rating is None

def test_359711_cargo_carried(snap_359711):
    assert "Utilities" in snap_359711.cargo_carried


# ===========================================================================
# usdot_3960415 — CITIZENS TELECOM / FRONTIER (DBA, crash data)
# ===========================================================================

@pytest.fixture(scope="module")
def snap_3960415():
    return _load("3960415")

def test_3960415_page_type(snap_3960415):
    assert snap_3960415.page_type == PAGE_CARRIER

def test_3960415_usdot_number(snap_3960415):
    assert snap_3960415.usdot_number == "3960415"

def test_3960415_legal_name(snap_3960415):
    assert snap_3960415.legal_name == "CITIZENS TELECOM SERVICES COMPANY LLC"

def test_3960415_dba_name(snap_3960415):
    assert snap_3960415.dba_name == "FRONTIER"

def test_3960415_usdot_status(snap_3960415):
    assert snap_3960415.usdot_status == "ACTIVE"

def test_3960415_power_units_int(snap_3960415):
    assert isinstance(snap_3960415.power_units, int)
    assert snap_3960415.power_units == 2937

def test_3960415_drivers_int(snap_3960415):
    assert isinstance(snap_3960415.drivers, int)
    assert snap_3960415.drivers == 2405

def test_3960415_mcs_150_mileage(snap_3960415):
    assert snap_3960415.mcs_150_mileage == 23840546
    assert snap_3960415.mcs_150_mileage_year == 2025

def test_3960415_us_inspections(snap_3960415):
    assert snap_3960415.us_inspections_total == 86

def test_3960415_us_crashes(snap_3960415):
    assert snap_3960415.us_crashes_fatal == 0
    assert snap_3960415.us_crashes_injury == 3
    assert snap_3960415.us_crashes_tow == 3
    assert snap_3960415.us_crashes_total == 6

def test_3960415_cargo_carried(snap_3960415):
    assert "Utilities" in snap_3960415.cargo_carried


# ===========================================================================
# usdot_073847 — RECORD NOT FOUND
# ===========================================================================

@pytest.fixture(scope="module")
def snap_073847():
    return _load("073847")

def test_073847_page_type(snap_073847):
    assert snap_073847.page_type == PAGE_NOT_FOUND

def test_073847_does_not_crash(snap_073847):
    assert snap_073847 is not None

def test_073847_usdot_number_extracted(snap_073847):
    # SAFER strips the leading zero
    assert snap_073847.usdot_number == "73847"

def test_073847_carrier_fields_are_none(snap_073847):
    for val in [snap_073847.legal_name, snap_073847.dba_name, snap_073847.entity_type,
                snap_073847.usdot_status, snap_073847.power_units, snap_073847.drivers,
                snap_073847.us_inspections_total, snap_073847.us_crashes_total,
                snap_073847.canada_inspections_total, snap_073847.safety_rating]:
        assert val is None

def test_073847_list_fields_are_empty(snap_073847):
    assert snap_073847.operation_classification == []
    assert snap_073847.carrier_operation == []
    assert snap_073847.cargo_carried == []


# ===========================================================================
# usdot_2844767 — RECORD INACTIVE
# ===========================================================================

@pytest.fixture(scope="module")
def snap_2844767():
    return _load("2844767")

def test_2844767_page_type(snap_2844767):
    assert snap_2844767.page_type == PAGE_INACTIVE

def test_2844767_does_not_crash(snap_2844767):
    assert snap_2844767 is not None

def test_2844767_usdot_number_extracted(snap_2844767):
    assert snap_2844767.usdot_number == "2844767"

def test_2844767_carrier_fields_are_none(snap_2844767):
    for val in [snap_2844767.legal_name, snap_2844767.dba_name, snap_2844767.entity_type,
                snap_2844767.usdot_status, snap_2844767.power_units, snap_2844767.drivers,
                snap_2844767.us_inspections_total, snap_2844767.us_crashes_total,
                snap_2844767.canada_inspections_total, snap_2844767.safety_rating]:
        assert val is None

def test_2844767_list_fields_are_empty(snap_2844767):
    assert snap_2844767.operation_classification == []
    assert snap_2844767.carrier_operation == []
    assert snap_2844767.cargo_carried == []
