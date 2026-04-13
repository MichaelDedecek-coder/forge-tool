"""Tests for Layer 3 — Categorization Agent."""

from unittest.mock import MagicMock, patch

import pytest

from agents.categorization import CategorizationAgent, CategorizedTransaction


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_transactions():
    """Minimal set of redacted transactions for unit tests."""
    return [
        {"merchant": "Albert hypermarket", "amount_czk": "1250.00", "mcc_code": "5411", "currency": "CZK"},
        {"merchant": "dm drogerie markt", "amount_czk": "320.00", "mcc_code": "5912", "currency": "CZK"},
        {"merchant": "Lékárna U Zlatého Lva", "amount_czk": "185.00", "mcc_code": "5912", "currency": "CZK"},
        {"merchant": "Netflix CZ", "amount_czk": "259.00", "mcc_code": "5815", "currency": "CZK"},
    ]


@pytest.fixture
def unknown_mcc_transaction():
    return [{"merchant": "Záhadný obchod", "amount_czk": "999.00", "mcc_code": "9999", "currency": "CZK"}]


# ---------------------------------------------------------------------------
# Rules strategy tests
# ---------------------------------------------------------------------------

def test_rules_categorizes_known_mcc(sample_transactions):
    agent = CategorizationAgent(strategy="rules")
    results = agent.categorize(sample_transactions)
    # Albert / MCC 5411 → Potraviny
    assert results[0].category_cz == "Potraviny"
    assert results[0].method == "rules"


def test_rules_returns_ostatni_for_unknown_mcc(unknown_mcc_transaction):
    agent = CategorizationAgent(strategy="rules")
    results = agent.categorize(unknown_mcc_transaction)
    assert results[0].category_cz == "Ostatní"
    assert results[0].confidence == 0.5


def test_rules_confidence_is_1(sample_transactions):
    agent = CategorizationAgent(strategy="rules")
    results = agent.categorize(sample_transactions)
    for r in results:
        assert r.confidence == 1.0


def test_rules_handles_ambiguous_mcc_5912(sample_transactions):
    agent = CategorizationAgent(strategy="rules")
    results = agent.categorize(sample_transactions)
    # Both dm drogerie and Lékárna have MCC 5912 — rules map both to Zdravotnictví
    dm = results[1]
    lekarna = results[2]
    assert dm.category_cz == lekarna.category_cz == "Zdravotnictví"
    # Rules CANNOT distinguish — this is the demo talking point


# ---------------------------------------------------------------------------
# Output shape test
# ---------------------------------------------------------------------------

def test_output_has_correct_shape(sample_transactions):
    agent = CategorizationAgent(strategy="rules")
    results = agent.categorize(sample_transactions)
    assert len(results) == len(sample_transactions)
    for r in results:
        assert isinstance(r, CategorizedTransaction)
        assert isinstance(r.transaction, dict)
        assert isinstance(r.category_cz, str)
        assert 0.0 <= r.confidence <= 1.0
        assert r.method in ("rules", "llm")


# ---------------------------------------------------------------------------
# Integration: ingest → redact → categorize
# ---------------------------------------------------------------------------

def test_all_persona_a_transactions_categorized():
    from agents.ingestion import IngestionAgent
    from agents.pii_redaction import PIIRedactor

    ingestion = IngestionAgent(samples_dir="data/samples")
    txs = ingestion.fetch("persona_a")
    redactor = PIIRedactor(known_names=["Jan Novák"])
    redacted = [redactor.redact_transaction(tx) for tx in txs]

    agent = CategorizationAgent(strategy="rules")
    results = agent.categorize(redacted, persona_id="persona_a")

    assert len(results) == len(redacted)
    assert all(r.category_cz for r in results)
    # No empty categories
    assert not any(r.category_cz == "" for r in results)


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

def test_audit_logging(audit_log, sample_transactions):
    agent = CategorizationAgent(strategy="rules", audit=audit_log)
    agent.categorize(sample_transactions, persona_id="test-persona")

    events = audit_log.events_for_layer("categorization")
    assert len(events) == 1
    e = events[0]
    assert e.action == "categorize"
    assert e.persona_id == "test-persona"
    assert e.metadata["strategy"] == "rules"
    assert e.metadata["count"] == 4
    assert e.metadata["classified"] == 4
    assert e.metadata["ambiguous"] == 2  # dm + lékárna both MCC 5912


# ---------------------------------------------------------------------------
# LLM strategy tests (require API key or mock)
# ---------------------------------------------------------------------------

@pytest.mark.llm
def test_llm_categorizes_transactions(sample_transactions):
    """Live LLM test — requires ANTHROPIC_API_KEY in environment."""
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    agent = CategorizationAgent(strategy="llm")
    results = agent.categorize(sample_transactions)

    assert len(results) == len(sample_transactions)
    assert all(r.method == "llm" for r in results)
    # LLM should distinguish dm drogerie from lékárna
    dm = results[1]
    lekarna = results[2]
    assert dm.category_cz == "Drogerie"
    assert lekarna.category_cz == "Zdravotnictví"


def test_llm_fallback_to_rules_on_api_error(sample_transactions):
    """When API fails, LLM strategy falls back to rules."""
    agent = CategorizationAgent(strategy="llm")
    with patch.object(agent, "_call_llm", side_effect=Exception("API down")):
        results = agent.categorize(sample_transactions)

    assert len(results) == len(sample_transactions)
    # Fallback = rules
    assert all(r.method == "rules" for r in results)
