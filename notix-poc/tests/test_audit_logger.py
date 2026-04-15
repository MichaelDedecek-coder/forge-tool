"""Layer 7 — Audit Logger writes append-only events to SQLite for
DORA Art. 11 + AI Act Art. 12 compliance. Spike-grade schema; the
production POC adds DORA-aligned fields.
"""

import pytest
from agents.audit_logger import AuditLogger, AuditEvent


@pytest.fixture
def logger(tmp_path):
    return AuditLogger(db_path=str(tmp_path / "audit.db"))


def test_writes_and_reads_back_event(logger):
    logger.log_event(
        layer="ingestion",
        action="fetch",
        persona_id="persona-a",
        metadata={"count": 247},
    )
    events = logger.events_for_layer("ingestion")
    assert len(events) == 1
    assert events[0].action == "fetch"
    assert events[0].persona_id == "persona-a"


def test_log_is_append_only(logger):
    """Audit log must NOT support deletion or updates."""
    logger.log_event(layer="ingestion", action="fetch", persona_id="x")
    with pytest.raises((NotImplementedError, AttributeError)):
        logger.delete_event(0)
    with pytest.raises((NotImplementedError, AttributeError)):
        logger.update_event(0, {})


def test_events_have_monotonic_timestamps(logger):
    for i in range(5):
        logger.log_event(layer="ingestion", action="fetch", persona_id=f"p{i}")
    events = logger.events_for_layer("ingestion")
    timestamps = [e.timestamp for e in events]
    assert timestamps == sorted(timestamps)


def test_log_event_with_dora_fields(logger):
    logger.log_event(
        layer="governance",
        action="escalate",
        persona_id="persona_c",
        metadata={"rule_id": "fraud_detection"},
        risk_classification="critical",
        decision_rationale="Card-not-present fraud detected, requires human review",
        data_subject_id="CLIENT_TOKEN_ABC123",
        retention_until="2031-04-15",
    )
    events = logger.events_for_layer("governance")
    assert len(events) == 1
    assert events[0].risk_classification == "critical"
    assert events[0].decision_rationale is not None
    assert events[0].data_subject_id == "CLIENT_TOKEN_ABC123"


def test_all_events_returns_all_layers(logger):
    logger.log_event(layer="ingestion", action="fetch", persona_id="a")
    logger.log_event(layer="categorization", action="classify", persona_id="a")
    logger.log_event(layer="governance", action="escalate", persona_id="a")
    events = logger.all_events()
    assert len(events) == 3
    layers = [e.layer for e in events]
    assert "ingestion" in layers
    assert "governance" in layers


def test_events_for_persona(logger):
    logger.log_event(layer="insight", action="generate", persona_id="persona_a")
    logger.log_event(layer="insight", action="generate", persona_id="persona_b")
    events = logger.events_for_persona("persona_a")
    assert len(events) == 1
    assert events[0].persona_id == "persona_a"


def test_event_count(logger):
    for i in range(5):
        logger.log_event(layer="test", action="count", persona_id=f"p{i}")
    assert logger.event_count() == 5


def test_export_csv(logger):
    logger.log_event(layer="ingestion", action="fetch", persona_id="persona_a",
                     metadata={"count": 50})
    csv_output = logger.export_csv()
    assert "ingestion" in csv_output
    assert "fetch" in csv_output
    assert "persona_a" in csv_output
    lines = csv_output.strip().split("\n")
    assert len(lines) == 2  # header + 1 data row


def test_export_json(logger):
    import json
    logger.log_event(layer="ingestion", action="fetch", persona_id="persona_a")
    json_output = logger.export_json()
    data = json.loads(json_output)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["layer"] == "ingestion"
