"""Tests for Layer 5 — Insight Agent (Czech narrative financial briefing generator).

All tests are marked @pytest.mark.llm as they make real Claude API calls.
ANTHROPIC_API_KEY is loaded via conftest.py load_dotenv.
"""

import pytest

from agents.insight import InsightAgent, InsightReport


def _load_pipeline_data(persona_id: str):
    """Helper: run Layers 1-4 for a persona and return all intermediate results."""
    from agents.ingestion import IngestionAgent
    from agents.categorization import CategorizationAgent
    from agents.anomaly import AnomalyAgent

    ingestion = IngestionAgent(samples_dir="data/samples")
    txs = ingestion.fetch(persona_id)

    categorizer = CategorizationAgent(strategy="rules")
    categories = categorizer.categorize(txs)

    anomaly = AnomalyAgent()
    flags = anomaly.detect(txs)

    return txs, categories, flags


@pytest.mark.llm
def test_insight_returns_well_formed_report():
    txs, cats, flags = _load_pipeline_data("persona_a")
    agent = InsightAgent()
    report = agent.generate(
        persona_id="persona_a", transactions=txs, categories=cats, anomalies=flags
    )

    assert isinstance(report, InsightReport)
    assert report.persona_id == "persona_a"
    assert len(report.summary_cz) > 20
    assert len(report.recommendations_cz) >= 1
    # Customer-facing strings must be Czech (contain at least one Czech diacritic)
    czech_chars = set("áčďéěíňóřšťúůýž")
    assert any(
        c in report.summary_cz.lower() for c in czech_chars
    ), "Summary must be in Czech"


@pytest.mark.llm
def test_persona_a_has_tier2_recommendation():
    """Persona A has investment scenario — should generate tier-2 recommendation."""
    txs, cats, flags = _load_pipeline_data("persona_a")
    agent = InsightAgent()
    report = agent.generate(
        persona_id="persona_a", transactions=txs, categories=cats, anomalies=flags
    )

    tier2 = [r for r in report.recommendations_cz if r.get("tier") == 2]
    assert len(tier2) >= 1
    for rec in tier2:
        assert rec["requires_approval"] is True


@pytest.mark.llm
def test_persona_c_anomalies_in_report():
    """Persona C has fraud — anomalies_cz should not be empty."""
    txs, cats, flags = _load_pipeline_data("persona_c")
    agent = InsightAgent()
    report = agent.generate(
        persona_id="persona_c", transactions=txs, categories=cats, anomalies=flags
    )

    assert len(report.anomalies_cz) >= 1


@pytest.mark.llm
def test_reasoning_trace_is_present():
    txs, cats, flags = _load_pipeline_data("persona_a")
    agent = InsightAgent()
    report = agent.generate(
        persona_id="persona_a", transactions=txs, categories=cats, anomalies=flags
    )

    assert report.reasoning_trace
    assert len(report.reasoning_trace) > 10


@pytest.mark.llm
def test_insight_emits_audit_event(audit_log):
    txs, cats, flags = _load_pipeline_data("persona_a")
    agent = InsightAgent(audit=audit_log)
    agent.generate(
        persona_id="persona_a", transactions=txs, categories=cats, anomalies=flags
    )

    events = audit_log.events_for_layer("insight")
    assert len(events) == 1
    assert "recommendations_count" in events[0].metadata
