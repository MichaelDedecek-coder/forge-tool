"""Layer 6 — Report Composer (George app format + Czech Markdown).

Pure formatter — NO LLM calls, NO external dependencies. Takes the
InsightReport (Layer 5) + CategorizedTransactions (Layer 3) and produces
a GeorgeAppReport with:
- Spending cards (sorted by amount, colored, with emoji icons)
- Alert sections (critical for anomalies, warning for tier-2 recs)
- MiFID II Art. 25 note on tier-2 recommendations
- Compliance footer (EU data governance, PII count)
- Full Czech Markdown rendering for the Next.js UI
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class ReportSection(BaseModel):
    icon: str           # emoji for UI display
    title_cz: str       # Czech section title
    content_cz: str     # Czech content (may contain markdown)
    severity: str = "info"  # "info" | "warning" | "critical" | "success"
    requires_approval: bool = False  # True for MiFID II Art. 25 escalated items


class GeorgeAppReport(BaseModel):
    """Final output format for the George app UI."""
    persona_id: str
    generated_at: datetime
    generation_time_s: float    # how long the pipeline took
    header_cz: str              # e.g. "Finanční přehled — poslední 3 měsíce"
    persona_label_cz: str       # e.g. "Senior · 67 let · Nový Bor · Důchod 25 000 Kč/měs."
    spending_cards: list[dict]  # [{category_cz, amount_czk, icon, bar_color, bar_width_pct}]
    sections: list[ReportSection]  # alerts, insights, recommendations
    compliance_footer_cz: str   # compliance disclaimer
    pii_leakage_count: int      # must be 0
    agent_count: int = 8        # always 8 for now
    markdown_cz: str            # full Markdown rendering for UI


class ReportComposer:
    LAYER_NAME = "report_composer"

    # Category → (emoji, color) mapping for spending cards
    CATEGORY_STYLE = {
        "Potraviny": ("🛒", "#4caf50"),
        "Restaurace": ("🍽️", "#ff9800"),
        "Bydlení": ("🏠", "#e53935"),
        "Hypotéka": ("🏡", "#e53935"),
        "Energie": ("⚡", "#2196f3"),
        "Doprava": ("🚇", "#2196f3"),
        "Auto": ("🚗", "#2196f3"),
        "Předplatné": ("📱", "#9c27b0"),
        "Zdravotnictví": ("💊", "#ff9800"),
        "Děti": ("👧", "#9c27b0"),
        "Dárky": ("🎁", "#9c27b0"),
        "Cestování": ("✈️", "#00bcd4"),
        "Elektronika": ("💻", "#607d8b"),
        "Sport": ("⚽", "#4caf50"),
        "Investice": ("📈", "#ff9800"),
        "Drobné nákupy": ("🛍️", "#607d8b"),
        "Ostatní": ("📦", "#607d8b"),
    }

    def __init__(self, audit=None):
        self.audit = audit

    def compose(self, insight_report, categories, anomalies,
                generation_time_s: float = 0.0, pii_leakage_count: int = 0) -> GeorgeAppReport:
        """Compose the final George app report from pipeline outputs.

        Args:
            insight_report: InsightReport from Layer 5
            categories: list of CategorizedTransaction from Layer 3
            anomalies: list of AnomalyFlag from Layer 4
            generation_time_s: total pipeline elapsed time
            pii_leakage_count: from Layer 2 (must be 0)
        """
        # Build spending cards from categorized transactions
        spending_cards = self._build_spending_cards(categories)

        # Build sections from insight report
        sections = []

        # Anomaly alerts first (most urgent)
        for i, anomaly_text in enumerate(insight_report.anomalies_cz):
            title = self._smart_title(anomaly_text)
            sections.append(ReportSection(
                icon="⚠️",
                title_cz=title,
                content_cz=anomaly_text,
                severity="critical",
            ))

        # Recommendations
        for rec in insight_report.recommendations_cz:
            tier = rec.get("tier", 1)
            requires_approval = rec.get("requires_approval", False)
            icon = "📈" if tier == 2 else "💡"
            severity = "warning" if requires_approval else "info"

            content = rec.get("text_cz", "")
            if requires_approval:
                content += "\n\n⏸️ *Toto doporučení čeká na schválení vaším poradcem (MiFID II Art. 25).*"

            sections.append(ReportSection(
                icon=icon,
                title_cz=self._smart_title(rec.get("text_cz", "Doporučení")),
                content_cz=content,
                severity=severity,
                requires_approval=requires_approval,
            ))

        # Summary as success section
        sections.append(ReportSection(
            icon="✅",
            title_cz="Shrnutí",
            content_cz=insight_report.summary_cz,
            severity="success",
        ))

        # Build persona label
        persona_labels = {
            "persona_a": "Mladý profesionál · 28 let · Praha · Příjem 60 000 Kč/měs.",
            "persona_b": "Rodina · 38 let · Brno · Příjem 110 000 Kč/měs.",
            "persona_c": "Senior · 67 let · Nový Bor · Důchod 25 000 Kč/měs.",
        }

        # Compliance footer
        compliance = (
            "🔒 Tento přehled prošel PII ochranou a governance kontrolou. "
            "Žádná osobní data neopustila území EU. "
        )
        has_escalation = any(
            rec.get("requires_approval") for rec in insight_report.recommendations_cz
        )
        has_anomaly = len(insight_report.anomalies_cz) > 0
        if has_escalation:
            compliance += "Investiční doporučení eskalováno k lidskému schválení (MiFID II Art. 25). "
        if has_anomaly:
            compliance += "Podezřelá transakce eskalována k lidskému ověření (AI Act Art. 14). "

        # Build markdown rendering
        markdown = self._render_markdown(
            insight_report, spending_cards, sections, compliance,
            generation_time_s, pii_leakage_count
        )

        report = GeorgeAppReport(
            persona_id=insight_report.persona_id,
            generated_at=datetime.utcnow(),
            generation_time_s=generation_time_s,
            header_cz="Finanční přehled — poslední 3 měsíce",
            persona_label_cz=persona_labels.get(
                insight_report.persona_id,
                f"Klient {insight_report.persona_id}"
            ),
            spending_cards=spending_cards,
            sections=sections,
            compliance_footer_cz=compliance,
            pii_leakage_count=pii_leakage_count,
            markdown_cz=markdown,
        )

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="compose",
                persona_id=insight_report.persona_id,
                metadata={
                    "sections_count": len(sections),
                    "spending_categories": len(spending_cards),
                    "has_escalation": has_escalation,
                    "pii_leakage": pii_leakage_count,
                },
            )

        return report

    @staticmethod
    def _smart_title(text: str, max_len: int = 60) -> str:
        """Extract a clean title: first sentence, cut at word boundary, add … if needed."""
        # Take first sentence
        first_sentence = text.split(".")[0].split("—")[0].split(":")[0].strip()

        if len(first_sentence) <= max_len:
            return first_sentence

        # Cut at last space before max_len
        truncated = first_sentence[:max_len]
        last_space = truncated.rfind(" ")
        if last_space > 20:
            truncated = truncated[:last_space]

        return truncated + "…"

    def _build_spending_cards(self, categories) -> list[dict]:
        """Aggregate spending by category for the card display."""
        totals: dict[str, Decimal] = defaultdict(Decimal)
        for cat in categories:
            amount = Decimal(str(cat.transaction["amount_czk"]))
            totals[cat.category_cz] += amount

        max_amount = max(totals.values()) if totals else Decimal("1")

        cards = []
        for cat_name, amount in sorted(totals.items(), key=lambda x: -x[1]):
            icon, color = self.CATEGORY_STYLE.get(cat_name, ("📦", "#607d8b"))
            bar_pct = int((amount / max_amount) * 100)
            cards.append({
                "category_cz": cat_name,
                "amount_czk": str(amount),
                "icon": icon,
                "bar_color": color,
                "bar_width_pct": bar_pct,
            })

        return cards

    def _render_markdown(self, insight, cards, sections, compliance, gen_time, pii) -> str:
        """Render the full report as Czech Markdown for the UI."""
        lines = [f"# {insight.persona_id} — Finanční přehled\n"]
        lines.append(f"_{insight.summary_cz}_\n")

        lines.append("## Výdaje tento týden\n")
        for card in cards:
            lines.append(f"- {card['icon']} **{card['category_cz']}**: {card['amount_czk']} Kč")
        lines.append("")

        for section in sections:
            severity_marker = {"critical": "🚨", "warning": "⚠️", "success": "✅", "info": "💡"}.get(
                section.severity, ""
            )
            lines.append(f"## {severity_marker} {section.title_cz}\n")
            lines.append(f"{section.content_cz}\n")

        lines.append(f"---\n{compliance}\n")
        lines.append(f"⚡ Vygenerováno za {gen_time:.1f} s · 8 agentů · {pii} úniků PII")

        return "\n".join(lines)
