"""Tests for Layer 4 — Anomaly Agent."""
import pytest
from decimal import Decimal
from agents.anomaly import AnomalyAgent, AnomalyFlag


@pytest.fixture
def persona_b_transactions():
    """Load persona_b (family) — has high_value_anomaly scenario marker."""
    from agents.ingestion import IngestionAgent
    agent = IngestionAgent(samples_dir="data/samples")
    return agent.fetch("persona_b")


@pytest.fixture
def persona_c_transactions():
    """Load persona_c (senior) — has fraud_card_not_present scenario marker."""
    from agents.ingestion import IngestionAgent
    agent = IngestionAgent(samples_dir="data/samples")
    return agent.fetch("persona_c")


@pytest.fixture
def persona_a_transactions():
    """Load persona_a (young professional) — investment scenario, NOT anomaly."""
    from agents.ingestion import IngestionAgent
    agent = IngestionAgent(samples_dir="data/samples")
    return agent.fetch("persona_a")


def test_detects_high_value_outlier(persona_b_transactions):
    agent = AnomalyAgent()
    flags = agent.detect(persona_b_transactions)
    high_value = [f for f in flags if f.type == "high_value_outlier"]
    assert len(high_value) >= 1
    assert high_value[0].severity in ("high", "critical")
    assert "Kč" in high_value[0].reason_cz


def test_detects_card_not_present_fraud(persona_c_transactions):
    agent = AnomalyAgent()
    flags = agent.detect(persona_c_transactions)
    fraud = [f for f in flags if f.type == "card_not_present_fraud"]
    assert len(fraud) >= 1
    assert fraud[0].severity == "critical"
    assert "karta" in fraud[0].reason_cz.lower() or "přítomna" in fraud[0].reason_cz.lower()


def test_no_fraud_false_positives_on_persona_a(persona_a_transactions):
    """Persona A's scenario is investment_recommendation, not fraud."""
    agent = AnomalyAgent()
    flags = agent.detect(persona_a_transactions)
    fraud_flags = [f for f in flags if f.type == "card_not_present_fraud"]
    assert len(fraud_flags) == 0


def test_returns_anomaly_flag_type():
    agent = AnomalyAgent()
    txs = [{"amount_czk": "100", "merchant": "Test", "card_present": True}]
    flags = agent.detect(txs)
    for f in flags:
        assert isinstance(f, AnomalyFlag)


def test_emits_audit_event(audit_log, persona_c_transactions):
    agent = AnomalyAgent(audit=audit_log)
    agent.detect(persona_c_transactions)
    events = audit_log.events_for_layer("anomaly")
    assert len(events) == 1
    assert "flags_count" in events[0].metadata


def test_handles_empty_transaction_list():
    agent = AnomalyAgent()
    flags = agent.detect([])
    assert flags == []


def test_handles_small_transaction_list():
    """Less than 10 transactions — can't compute meaningful 95th percentile."""
    agent = AnomalyAgent()
    txs = [{"amount_czk": "500", "merchant": "Albert", "card_present": True} for _ in range(5)]
    flags = agent.detect(txs)
    # Should not crash, may return empty
    assert isinstance(flags, list)
