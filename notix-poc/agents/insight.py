"""Layer 5 — Insight Agent (Czech narrative financial briefing generator).

The HEART of the product — what the ČS client sees in the George app.

Takes categorized transactions + anomaly flags and produces a personalized
Czech-language financial briefing as a structured InsightReport. Consumed
by Layer 6 (Report Composer) for final rendering.

AI Act Art. 13 compliance: reasoning_trace is captured but NOT shown to
the customer — it is available for right-to-explanation requests.
"""

from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from agents.audit_logger import AuditLogger


class InsightReport(BaseModel):
    """Structured output from the Insight Agent.

    Consumed by Layer 6 (Report Composer) to render the final
    user-facing output. All customer-facing strings are in Czech.
    """

    persona_id: str
    summary_cz: str = Field(
        description="2-3 sentence Czech summary of the week's finances"
    )
    spending_breakdown_cz: dict[str, str] = Field(
        description=(
            "Category → 1-sentence Czech narrative "
            "(e.g. 'Potraviny': 'Utratili jste 4 850 Kč...')"
        )
    )
    anomalies_cz: list[str] = Field(
        description="One bullet per anomaly flag, Czech, customer-friendly language"
    )
    recommendations_cz: list[dict] = Field(
        description=(
            "2-3 recommendations. Each: "
            "{tier: 1|2, text_cz: str, requires_approval: bool}"
        )
    )
    reasoning_trace: str = Field(
        description=(
            "Internal LLM reasoning — NOT shown to customer "
            "(AI Act Art. 13 right to explanation)"
        )
    )


class InsightAgent:
    LAYER_NAME = "insight"
    MODEL = "claude-haiku-4-5-20251001"  # fast + cheap, sufficient for narrative

    SYSTEM_PROMPT = """Jsi privátní bankéř pro klienty České spořitelny. Tvým úkolem je
napsat personalizovaný finanční přehled pro klienta na základě jeho transakcí za poslední 3 měsíce.

Pravidla:
- Píšeš pouze česky, s plnou diakritikou a bezchybnou gramatikou (správná shoda podstatných a přídavných jmen v rodě, čísle a pádě)
- Tón: vstřícný, pomáhající, NE prodejní
- NIKDY nepoužívej emoji v textu — žádné 🔴, ⚠️, ✅, 💡 ani jiné. Text musí být čistý bez emoji.
- anomalies_cz: POUZE skutečné problémy (podezřelé transakce, podvody, neobvyklé výdaje). NIKDY sem nedávej pozitivní zprávy ani informace — ty patří do recommendations_cz.
- recommendations_cz: tipy, doporučení, pozitivní zprávy. Tier 1 = drobné optimalizace (requires_approval: false). Tier 2 = investice, úvěr, pojistka, finanční produkty (requires_approval: true).
- Vrať pouze JSON objekt přesně podle schématu, nic jiného

Schéma:
{
  "summary_cz": "2-3 věty shrnutí (bez emoji)",
  "spending_breakdown_cz": {"Kategorie": "popis"},
  "anomalies_cz": ["POUZE problémy a podezřelé transakce"],
  "recommendations_cz": [{"tier": 1, "text_cz": "...", "requires_approval": false}],
  "reasoning_trace": "interní úvaha (zákazník ji nevidí)"
}
"""

    def __init__(self, audit: AuditLogger | None = None):
        self.audit = audit

    def generate(
        self,
        persona_id: str,
        transactions: list[dict[str, Any]],
        categories: list,
        anomalies: list,
    ) -> InsightReport:
        """Generate a personalized Czech financial briefing.

        Args:
            persona_id: e.g. "persona_a"
            transactions: raw transaction dicts from Ingestion
            categories: list of CategorizedTransaction from Layer 3
            anomalies: list of AnomalyFlag from Layer 4
        """
        user_message = self._format_input(transactions, categories, anomalies)

        import anthropic

        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model=os.environ.get("INSIGHT_MODEL", self.MODEL),
            max_tokens=2000,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_json = response.content[0].text.strip()
        # Strip markdown code fences if present
        if raw_json.startswith("```"):
            lines = raw_json.split("\n")
            raw_json = "\n".join(lines[1:-1])

        data = json.loads(raw_json)
        data["persona_id"] = persona_id
        report = InsightReport(**data)

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="generate",
                persona_id=persona_id,
                metadata={
                    "recommendations_count": len(report.recommendations_cz),
                    "tier2_count": sum(
                        1 for r in report.recommendations_cz if r.get("tier") == 2
                    ),
                    "anomalies_count": len(report.anomalies_cz),
                },
            )

        return report

    def _format_input(self, transactions: list, categories: list, anomalies: list) -> str:
        """Build a compact summary for the LLM prompt."""
        category_totals: dict[str, Decimal] = defaultdict(Decimal)
        category_counts: Counter = Counter()

        for cat in categories:
            cat_name = cat.category_cz if hasattr(cat, "category_cz") else str(cat)
            amount = (
                Decimal(str(cat.transaction["amount_czk"]))
                if hasattr(cat, "transaction")
                else Decimal("0")
            )
            category_totals[cat_name] += amount
            category_counts[cat_name] += 1

        total = sum(category_totals.values())

        lines = [f"Celkové výdaje: {total} Kč za posledních 90 dní.\n"]
        lines.append("Výdaje dle kategorií:")
        for cat, amount in sorted(category_totals.items(), key=lambda x: -x[1]):
            lines.append(
                f"  - {cat}: {amount} Kč ({category_counts[cat]} transakcí)"
            )

        if anomalies:
            lines.append(f"\nDetekované anomálie ({len(anomalies)}):")
            for a in anomalies:
                reason = a.reason_cz if hasattr(a, "reason_cz") else str(a)
                severity = a.severity if hasattr(a, "severity") else "unknown"
                lines.append(f"  - [{severity}] {reason}")

        lines.append(f"\nPočet transakcí celkem: {len(transactions)}")

        return "\n".join(lines)
