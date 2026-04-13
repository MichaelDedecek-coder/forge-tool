"""Layer 3 — Categorization Agent (Dual Strategy).

Classifies redacted transactions into Czech spending categories using
either deterministic MCC-code rules or Claude LLM for intelligent
disambiguation. Both strategies return identical output — swappable
at construction time.

Demo wow moment: MCC 5912 maps to both "Zdravotnictví" (lékárna) AND
"Drogerie" (dm, Rossmann). Rules can't tell them apart. LLM can.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from agents.audit_logger import AuditLogger


@dataclass
class CategorizedTransaction:
    transaction: dict[str, Any]
    category_cz: str
    confidence: float
    method: str  # "rules" | "llm"


# Reverse mapping from transaction_generator.py MERCHANT_POOL
MCC_TO_CATEGORY: dict[str, str] = {
    "6513": "Bydlení",
    "5815": "Předplatné",
    "4899": "Předplatné",
    "4111": "Doprava",
    "6159": "Hypotéka",
    "4911": "Energie",
    "4924": "Energie",
    "8351": "Děti",
    "7941": "Děti",
    "8299": "Děti",
    "5521": "Auto",
    "6411": "Auto",
    "5912": "Zdravotnictví",  # AMBIGUOUS: also Drogerie — rules can't distinguish!
    "8011": "Zdravotnictví",
    "5812": "Restaurace",
    "5814": "Restaurace",
    "3000": "Cestování",
    "7011": "Cestování",
    "4112": "Cestování",
    "4131": "Cestování",
    "4722": "Cestování",
    "5734": "Elektronika",
    "5732": "Elektronika",
    "5941": "Sport",
    "7997": "Sport",
    "5411": "Potraviny",
    "5712": "Domácnost",
    "5251": "Domácnost",
    "5992": "Dárky",
    "5942": "Dárky",
    "5944": "Dárky",
    "5994": "Drobné nákupy",
    "6211": "Investice",
    "5511": "Auto",
}


class CategorizationAgent:
    LAYER_NAME = "categorization"

    def __init__(self, strategy: str = "rules", audit: AuditLogger | None = None):
        if strategy not in ("rules", "llm"):
            raise ValueError(f"Unknown strategy: {strategy!r} (expected 'rules' or 'llm')")
        self.strategy = strategy
        self.audit = audit

    def categorize(
        self, transactions: list[dict[str, Any]], persona_id: str | None = None
    ) -> list[CategorizedTransaction]:
        if self.strategy == "rules":
            results = self._categorize_rules(transactions)
        else:
            results = self._categorize_llm(transactions)

        if self.audit:
            ambiguous = sum(1 for r in results if r.transaction.get("mcc_code") == "5912")
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="categorize",
                persona_id=persona_id,
                metadata={
                    "count": len(transactions),
                    "classified": len(results),
                    "strategy": self.strategy,
                    "ambiguous": ambiguous,
                },
            )

        return results

    def _categorize_rules(
        self, transactions: list[dict[str, Any]]
    ) -> list[CategorizedTransaction]:
        results = []
        for tx in transactions:
            mcc = tx.get("mcc_code", "")
            category = MCC_TO_CATEGORY.get(mcc, "Ostatní")
            confidence = 1.0 if mcc in MCC_TO_CATEGORY else 0.5
            results.append(CategorizedTransaction(
                transaction=tx,
                category_cz=category,
                confidence=confidence,
                method="rules",
            ))
        return results

    def _categorize_llm(
        self, transactions: list[dict[str, Any]]
    ) -> list[CategorizedTransaction]:
        try:
            return self._call_llm(transactions)
        except Exception:
            return self._categorize_rules(transactions)

    def _call_llm(
        self, transactions: list[dict[str, Any]]
    ) -> list[CategorizedTransaction]:
        import anthropic

        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

        all_results: list[CategorizedTransaction] = []
        for i in range(0, len(transactions), 50):
            batch = transactions[i : i + 50]
            batch_input = [
                {
                    "index": j,
                    "merchant": tx.get("merchant", ""),
                    "amount_czk": tx.get("amount_czk", ""),
                    "mcc_code": tx.get("mcc_code", ""),
                }
                for j, tx in enumerate(batch)
            ]

            response = client.messages.create(
                model=os.environ.get("CATEGORIZATION_MODEL", "claude-haiku-4-5-20251001"),
                max_tokens=2048,
                system=(
                    "Jsi český finanční analytik. Pro každou transakci urči kategorii "
                    "výdaje v češtině. Vrať POUZE validní JSON pole objektů s klíči: "
                    '"index" (int), "category_cz" (string), "confidence" (float 0.0-1.0). '
                    "Kategorie: Potraviny, Restaurace, Doprava, Bydlení, Energie, "
                    "Předplatné, Hypotéka, Děti, Auto, Zdravotnictví, Drogerie, "
                    "Cestování, Elektronika, Sport, Domácnost, Dárky, Drobné nákupy, "
                    "Investice, Ostatní. "
                    "DŮLEŽITÉ: Rozliš lékárnu (Zdravotnictví) od drogerie jako dm/Rossmann "
                    "(Drogerie) — obě mají MCC 5912, ale jsou to různé kategorie."
                ),
                messages=[
                    {
                        "role": "user",
                        "content": (
                            "Kategorizuj tyto transakce:\n"
                            f"{json.dumps(batch_input, ensure_ascii=False)}"
                        ),
                    }
                ],
            )

            raw_text = response.content[0].text.strip()
            if raw_text.startswith("```"):
                lines = raw_text.split("\n")
                raw_text = "\n".join(lines[1:-1])
            parsed = json.loads(raw_text)

            for item in parsed:
                idx = item["index"]
                all_results.append(CategorizedTransaction(
                    transaction=batch[idx],
                    category_cz=item["category_cz"],
                    confidence=item["confidence"],
                    method="llm",
                ))

        return all_results
