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
