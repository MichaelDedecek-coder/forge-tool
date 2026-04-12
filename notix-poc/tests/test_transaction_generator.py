import pytest
from decimal import Decimal
from datetime import date

from data.personas import PERSONA_A, PERSONA_B, PERSONA_C
from data.transaction_generator import generate_transactions, Transaction


def test_generates_at_least_one_transaction_per_persona():
    txs = generate_transactions(PERSONA_A, days=90, seed=42)
    assert len(txs) > 0


def test_all_records_match_transaction_shape():
    txs = generate_transactions(PERSONA_A, days=90, seed=42)
    for tx in txs:
        assert isinstance(tx, Transaction)
        assert isinstance(tx.date, date)
        assert tx.amount_czk > 0
        assert tx.merchant
        assert tx.mcc_code
        assert tx.currency == "CZK"
        assert tx.account_holder_name
        assert tx.iban


def test_seed_is_deterministic():
    a = generate_transactions(PERSONA_A, days=30, seed=42)
    b = generate_transactions(PERSONA_A, days=30, seed=42)
    assert [t.amount_czk for t in a] == [t.amount_czk for t in b]


def test_persona_c_has_pharmacy_transactions():
    txs = generate_transactions(PERSONA_C, days=90, seed=42)
    pharmacy = [t for t in txs if "lékárna" in t.merchant.lower() or t.mcc_code == "5912"]
    assert len(pharmacy) >= 3


def test_persona_c_triggers_fraud_scenario():
    txs = generate_transactions(PERSONA_C, days=90, seed=42)
    fraud = [t for t in txs if t.scenario_marker == "fraud_card_not_present"]
    assert len(fraud) >= 1
    assert fraud[0].card_present is False
    assert fraud[0].amount_czk >= Decimal("5000")


def test_persona_a_triggers_investment_recommendation_scenario():
    txs = generate_transactions(PERSONA_A, days=90, seed=42)
    inv = [t for t in txs if t.scenario_marker == "investment_recommendation"]
    assert len(inv) >= 1


def test_persona_b_triggers_high_value_anomaly_scenario():
    txs = generate_transactions(PERSONA_B, days=90, seed=42)
    anom = [t for t in txs if t.scenario_marker == "high_value_anomaly"]
    assert len(anom) >= 1
    assert anom[0].amount_czk >= Decimal("50000")
