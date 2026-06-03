"""
Tests for safer_parser against the saved USDOT 2874852 fixture.
"""
import sys
from pathlib import Path

import pytest

# Allow running pytest from anywhere inside tools/safer_poc/
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "src"))

from safer_parser import parse_safer_html

FIXTURE = _ROOT / "tests" / "fixtures" / "usdot_2874852.html"


@pytest.fixture(scope="module")
def snapshot():
    html = FIXTURE.read_text(encoding="utf-8", errors="replace")
    return parse_safer_html(html)


def test_usdot_number(snapshot):
    assert snapshot.usdot_number == "2874852"


def test_legal_name(snapshot):
    assert snapshot.legal_name == "ALL PURPOSE HANDY HELPERS"


def test_entity_type(snapshot):
    assert snapshot.entity_type == "CARRIER"


def test_usdot_status(snapshot):
    assert snapshot.usdot_status == "ACTIVE"


def test_operating_authority_status(snapshot):
    assert snapshot.operating_authority_status == "NOT AUTHORIZED"


def test_phone(snapshot):
    assert snapshot.phone == "(713) 377-2124"


def test_power_units_is_int(snapshot):
    assert snapshot.power_units == 399997


def test_drivers_is_int(snapshot):
    assert snapshot.drivers == 12


def test_operation_classification_includes(snapshot):
    assert "Private(Property)" in snapshot.operation_classification


def test_carrier_operation_includes(snapshot):
    assert "Intrastate Only (Non-HM)" in snapshot.carrier_operation


def test_cargo_carried_includes(snapshot):
    assert "General Freight" in snapshot.cargo_carried


def test_blank_fields_are_none(snapshot):
    # Spot-check: any field the fixture leaves blank should be None, not "".
    for val in [
        snapshot.usdot_number,
        snapshot.legal_name,
        snapshot.entity_type,
        snapshot.usdot_status,
        snapshot.operating_authority_status,
        snapshot.phone,
    ]:
        assert val != "", "blank string must be normalized to None"
