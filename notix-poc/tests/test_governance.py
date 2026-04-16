"""Tests for Layer 8 — Governance Gate (AI Act Art. 14 human oversight).

TDD: tests written before implementation.
"""

import pytest
from agents.governance import GovernanceGate, GovernanceDecision


@pytest.fixture
def gate(tmp_path):
    """Create a GovernanceGate with the real default.yaml policy."""
    return GovernanceGate(policy_path="policies/default.yaml")


def test_tier2_investment_recommendation_escalates(gate):
    """MiFID II Art. 25 — investment recommendations need human approval."""
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="persona_a",
        summary_cz="Test summary",
        spending_breakdown_cz={},
        anomalies_cz=[],
        recommendations_cz=[
            {"tier": 2, "text_cz": "Doporučujeme zvážit investici do spořicího účtu.", "requires_approval": True},
        ],
        reasoning_trace="test",
    )
    decisions = gate.evaluate_report(report)
    assert len(decisions) == 1
    assert decisions[0].classification == "escalate"
    assert "MiFID II" in str(decisions[0].compliance_refs)


def test_tier1_recommendation_auto_executes(gate):
    """Tier 1 savings tips pass through automatically."""
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="persona_a",
        summary_cz="Test",
        spending_breakdown_cz={},
        anomalies_cz=[],
        recommendations_cz=[
            {"tier": 1, "text_cz": "Výdaje za restaurace jsou o 35 % vyšší.", "requires_approval": False},
        ],
        reasoning_trace="test",
    )
    decisions = gate.evaluate_report(report)
    assert len(decisions) == 1
    assert decisions[0].classification == "auto"


def test_critical_anomaly_escalates(gate):
    """AI Act Art. 14 — critical anomalies need human oversight."""
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="persona_c",
        summary_cz="Test",
        spending_breakdown_cz={},
        anomalies_cz=["Podezřelá platba 8 500 Kč u zahraničního e-shopu."],
        recommendations_cz=[],
        reasoning_trace="test",
    )
    decisions = gate.evaluate_report(report)
    assert len(decisions) == 1
    assert decisions[0].classification == "escalate"
    assert "AI Act Art. 14" in str(decisions[0].compliance_refs)


def test_mixed_report_correct_classifications(gate):
    """Report with both tier-1 (auto) and tier-2 (escalate) + anomaly (escalate)."""
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="persona_b",
        summary_cz="Test",
        spending_breakdown_cz={},
        anomalies_cz=["Neobvyklá transakce 75 000 Kč."],
        recommendations_cz=[
            {"tier": 1, "text_cz": "Energie jsou o 12 % nižší.", "requires_approval": False},
            {"tier": 2, "text_cz": "Zvažte investici do ETF fondu.", "requires_approval": True},
        ],
        reasoning_trace="test",
    )
    decisions = gate.evaluate_report(report)
    assert len(decisions) == 3  # 2 recs + 1 anomaly
    classifications = [d.classification for d in decisions]
    assert "auto" in classifications
    assert classifications.count("escalate") == 2  # tier-2 rec + anomaly


def test_every_decision_has_rule_id(gate):
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="test",
        summary_cz="Test",
        spending_breakdown_cz={},
        anomalies_cz=["Alert"],
        recommendations_cz=[{"tier": 1, "text_cz": "Tip", "requires_approval": False}],
        reasoning_trace="test",
    )
    decisions = gate.evaluate_report(report)
    for d in decisions:
        assert d.rule_id
        assert isinstance(d, GovernanceDecision)


def test_emits_audit_event(gate, audit_log):
    gate_with_audit = GovernanceGate(policy_path="policies/default.yaml", audit=audit_log)
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="persona_a",
        summary_cz="Test",
        spending_breakdown_cz={},
        anomalies_cz=[],
        recommendations_cz=[{"tier": 1, "text_cz": "Tip", "requires_approval": False}],
        reasoning_trace="test",
    )
    gate_with_audit.evaluate_report(report)
    events = audit_log.events_for_layer("governance")
    assert len(events) == 1
    assert "escalate_count" in events[0].metadata


def test_empty_report_returns_no_decisions(gate):
    from agents.insight import InsightReport
    report = InsightReport(
        persona_id="test",
        summary_cz="Vše v pořádku.",
        spending_breakdown_cz={},
        anomalies_cz=[],
        recommendations_cz=[],
        reasoning_trace="test",
    )
    decisions = gate.evaluate_report(report)
    assert decisions == []
