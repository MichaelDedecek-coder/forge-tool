import pytest
from datetime import datetime
from agents.report_composer import ReportComposer, GeorgeAppReport, ReportSection


def _make_mock_insight():
    """Create a minimal InsightReport-like object for testing."""
    from agents.insight import InsightReport
    return InsightReport(
        persona_id="persona_c",
        summary_cz="Vaše celkové výdaje za tento měsíc jsou 18 200 Kč.",
        spending_breakdown_cz={"Potraviny": "1 840 Kč", "Lékárna": "620 Kč"},
        anomalies_cz=["Podezřelá platba 8 500 Kč u zahraničního e-shopu."],
        recommendations_cz=[
            {"tier": 1, "text_cz": "Výdaje za léky rostou o 22 %.", "requires_approval": False},
            {"tier": 2, "text_cz": "Zvažte přesun úspor na spořicí účet.", "requires_approval": True},
        ],
        reasoning_trace="Internal trace.",
    )


def _make_mock_categories():
    """Create minimal CategorizedTransaction-like objects."""
    from agents.categorization import CategorizedTransaction
    return [
        CategorizedTransaction(transaction={"amount_czk": "1840", "merchant": "Albert"}, category_cz="Potraviny", confidence=1.0, method="rules"),
        CategorizedTransaction(transaction={"amount_czk": "620", "merchant": "Dr.Max"}, category_cz="Zdravotnictví", confidence=1.0, method="rules"),
        CategorizedTransaction(transaction={"amount_czk": "3200", "merchant": "ČEZ"}, category_cz="Energie", confidence=1.0, method="rules"),
    ]


def test_compose_returns_george_app_report():
    composer = ReportComposer()
    report = composer.compose(
        insight_report=_make_mock_insight(),
        categories=_make_mock_categories(),
        anomalies=[],
        generation_time_s=2.4,
        pii_leakage_count=0,
    )
    assert isinstance(report, GeorgeAppReport)
    assert report.persona_id == "persona_c"
    assert report.pii_leakage_count == 0
    assert report.agent_count == 8


def test_spending_cards_are_sorted_by_amount():
    composer = ReportComposer()
    report = composer.compose(_make_mock_insight(), _make_mock_categories(), [], 2.0, 0)
    amounts = [card["amount_czk"] for card in report.spending_cards]
    # Should be descending by amount
    assert amounts[0] == "3200"  # Energie is highest


def test_anomaly_creates_critical_section():
    composer = ReportComposer()
    report = composer.compose(_make_mock_insight(), _make_mock_categories(), [], 2.0, 0)
    critical = [s for s in report.sections if s.severity == "critical"]
    assert len(critical) >= 1
    assert "podezřelá" in critical[0].content_cz.lower() or "8 500" in critical[0].content_cz


def test_tier2_recommendation_has_mifid_note():
    composer = ReportComposer()
    report = composer.compose(_make_mock_insight(), _make_mock_categories(), [], 2.0, 0)
    tier2_sections = [s for s in report.sections if "MiFID" in s.content_cz]
    assert len(tier2_sections) >= 1


def test_compliance_footer_mentions_eu():
    composer = ReportComposer()
    report = composer.compose(_make_mock_insight(), _make_mock_categories(), [], 2.0, 0)
    assert "EU" in report.compliance_footer_cz
    assert "MiFID" in report.compliance_footer_cz  # has tier-2 recommendation


def test_markdown_contains_czech_content():
    composer = ReportComposer()
    report = composer.compose(_make_mock_insight(), _make_mock_categories(), [], 2.4, 0)
    assert "Finanční přehled" in report.markdown_cz
    assert "2.4 s" in report.markdown_cz
    assert "0 úniků PII" in report.markdown_cz


def test_emits_audit_event(audit_log):
    composer = ReportComposer(audit=audit_log)
    composer.compose(_make_mock_insight(), _make_mock_categories(), [], 2.0, 0)
    events = audit_log.events_for_layer("report_composer")
    assert len(events) == 1
    assert events[0].metadata["pii_leakage"] == 0
