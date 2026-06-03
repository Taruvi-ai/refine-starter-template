"""
Tests for safer_parser against saved SAFER HTML fixtures.

Fixtures
--------
usdot_2874852  — valid carrier, private property, intrastate, power_units "399,997" (numeric normalization)
usdot_154740   — valid carrier, auth-for-hire + private, interstate
usdot_359711   — valid carrier, private property, interstate
usdot_3960415  — valid carrier, private property, interstate
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


# ---------------------------------------------------------------------------
# usdot_2874852 — baseline carrier (numeric normalization fixture)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def snap_2874852():
    return _load("2874852")


def test_2874852_page_type(snap_2874852):
    assert snap_2874852.page_type == PAGE_CARRIER

def test_2874852_usdot_number(snap_2874852):
    assert snap_2874852.usdot_number == "2874852"

def test_2874852_legal_name(snap_2874852):
    assert snap_2874852.legal_name == "ALL PURPOSE HANDY HELPERS"

def test_2874852_entity_type(snap_2874852):
    assert snap_2874852.entity_type == "CARRIER"

def test_2874852_usdot_status(snap_2874852):
    assert snap_2874852.usdot_status == "ACTIVE"

def test_2874852_operating_authority_status(snap_2874852):
    assert snap_2874852.operating_authority_status == "NOT AUTHORIZED"

def test_2874852_phone(snap_2874852):
    assert snap_2874852.phone == "(713) 377-2124"

def test_2874852_power_units(snap_2874852):
    assert snap_2874852.power_units == 399997

def test_2874852_drivers(snap_2874852):
    assert snap_2874852.drivers == 12

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


# ---------------------------------------------------------------------------
# usdot_154740 — WESTERN OILFIELDS SUPPLY CO, auth-for-hire + private
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def snap_154740():
    return _load("154740")


def test_154740_page_type(snap_154740):
    assert snap_154740.page_type == PAGE_CARRIER

def test_154740_usdot_number(snap_154740):
    assert snap_154740.usdot_number == "154740"

def test_154740_legal_name(snap_154740):
    assert snap_154740.legal_name == "WESTERN OILFIELDS SUPPLY CO"

def test_154740_entity_type(snap_154740):
    assert snap_154740.entity_type == "CARRIER"

def test_154740_usdot_status(snap_154740):
    assert snap_154740.usdot_status == "ACTIVE"

def test_154740_power_units_is_int(snap_154740):
    assert isinstance(snap_154740.power_units, int)
    assert snap_154740.power_units == 1139

def test_154740_drivers_is_int(snap_154740):
    assert isinstance(snap_154740.drivers, int)
    assert snap_154740.drivers == 1146

def test_154740_operation_classification_multi(snap_154740):
    assert "Auth. For Hire" in snap_154740.operation_classification
    assert "Private(Property)" in snap_154740.operation_classification

def test_154740_carrier_operation(snap_154740):
    assert "Interstate" in snap_154740.carrier_operation


# ---------------------------------------------------------------------------
# usdot_359711 — KENTUCKY UTILITIES
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def snap_359711():
    return _load("359711")


def test_359711_page_type(snap_359711):
    assert snap_359711.page_type == PAGE_CARRIER

def test_359711_usdot_number(snap_359711):
    assert snap_359711.usdot_number == "359711"

def test_359711_legal_name(snap_359711):
    assert snap_359711.legal_name == "KENTUCKY UTILITIES"

def test_359711_entity_type(snap_359711):
    assert snap_359711.entity_type == "CARRIER"

def test_359711_usdot_status(snap_359711):
    assert snap_359711.usdot_status == "ACTIVE"

def test_359711_power_units_is_int(snap_359711):
    assert isinstance(snap_359711.power_units, int)
    assert snap_359711.power_units == 280

def test_359711_drivers_is_int(snap_359711):
    assert isinstance(snap_359711.drivers, int)
    assert snap_359711.drivers == 285

def test_359711_cargo_carried(snap_359711):
    assert "Utilities" in snap_359711.cargo_carried


# ---------------------------------------------------------------------------
# usdot_3960415 — CITIZENS TELECOM SERVICES COMPANY LLC
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def snap_3960415():
    return _load("3960415")


def test_3960415_page_type(snap_3960415):
    assert snap_3960415.page_type == PAGE_CARRIER

def test_3960415_usdot_number(snap_3960415):
    assert snap_3960415.usdot_number == "3960415"

def test_3960415_legal_name(snap_3960415):
    assert snap_3960415.legal_name == "CITIZENS TELECOM SERVICES COMPANY LLC"

def test_3960415_entity_type(snap_3960415):
    assert snap_3960415.entity_type == "CARRIER"

def test_3960415_usdot_status(snap_3960415):
    assert snap_3960415.usdot_status == "ACTIVE"

def test_3960415_power_units_is_int(snap_3960415):
    assert isinstance(snap_3960415.power_units, int)
    assert snap_3960415.power_units == 2937

def test_3960415_drivers_is_int(snap_3960415):
    assert isinstance(snap_3960415.drivers, int)
    assert snap_3960415.drivers == 2405

def test_3960415_cargo_carried(snap_3960415):
    assert "Utilities" in snap_3960415.cargo_carried


# ---------------------------------------------------------------------------
# usdot_073847 — RECORD NOT FOUND
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def snap_073847():
    return _load("073847")


def test_073847_page_type(snap_073847):
    assert snap_073847.page_type == PAGE_NOT_FOUND

def test_073847_does_not_crash(snap_073847):
    # The fixture above already proves no exception; this makes intent explicit.
    assert snap_073847 is not None

def test_073847_usdot_number_extracted(snap_073847):
    # SAFER strips the leading zero — DOT shown as 73847, not 073847.
    assert snap_073847.usdot_number == "73847"

def test_073847_carrier_fields_are_none(snap_073847):
    for val in [snap_073847.legal_name, snap_073847.entity_type,
                snap_073847.usdot_status, snap_073847.power_units,
                snap_073847.drivers]:
        assert val is None

def test_073847_list_fields_are_empty(snap_073847):
    assert snap_073847.operation_classification == []
    assert snap_073847.carrier_operation == []
    assert snap_073847.cargo_carried == []


# ---------------------------------------------------------------------------
# usdot_2844767 — RECORD INACTIVE
# ---------------------------------------------------------------------------

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
    for val in [snap_2844767.legal_name, snap_2844767.entity_type,
                snap_2844767.usdot_status, snap_2844767.power_units,
                snap_2844767.drivers]:
        assert val is None

def test_2844767_list_fields_are_empty(snap_2844767):
    assert snap_2844767.operation_classification == []
    assert snap_2844767.carrier_operation == []
    assert snap_2844767.cargo_carried == []
