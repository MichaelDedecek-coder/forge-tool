"""Layer 8 — Governance Gate (Human-above-the-Loop).

YAML rules engine that classifies each decision from the Insight Agent as:
auto (pass through) | escalate (human approval needed) | block (prohibited).

This is the compliance differentiator — AI Act Art. 14 human oversight,
implemented as architecture, not as a checkbox.
"""

import yaml
from dataclasses import dataclass
from typing import Any
from agents.audit_logger import AuditLogger


@dataclass
class GovernanceDecision:
    classification: str     # "auto" | "escalate" | "block"
    rule_id: str            # which rule matched
    rationale_cz: str       # Czech explanation
    compliance_refs: list[str]  # ["AI Act Art. 14", "MiFID II Art. 25"]
    original_item: dict     # the recommendation or anomaly that was evaluated


class GovernanceGate:
    LAYER_NAME = "governance"

    def __init__(self, policy_path: str, audit: AuditLogger | None = None):
        with open(policy_path) as f:
            self.policy = yaml.safe_load(f)
        self.audit = audit

    def evaluate_report(self, insight_report) -> list[GovernanceDecision]:
        """Evaluate all recommendations and anomalies in an InsightReport.

        Returns a list of GovernanceDecision objects — one per item evaluated.
        Items classified as 'escalate' should be marked in the final report
        with a human approval badge.
        """
        decisions = []

        # Evaluate each recommendation
        for rec in insight_report.recommendations_cz:
            decision_input = {
                "type": "recommendation",
                "recommendation_tier": rec.get("tier", 1),
                "text_cz": rec.get("text_cz", ""),
                "requires_approval": rec.get("requires_approval", False),
            }
            decision = self._evaluate(decision_input)
            decisions.append(decision)

        # Evaluate each anomaly
        for anomaly_text in insight_report.anomalies_cz:
            decision_input = {
                "type": "anomaly",
                "anomaly_severity": "critical",  # all anomalies in InsightReport are significant
                "text_cz": anomaly_text,
            }
            decision = self._evaluate(decision_input)
            decisions.append(decision)

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="evaluate_report",
                persona_id=getattr(insight_report, 'persona_id', None),
                metadata={
                    "total_items": len(decisions),
                    "auto_count": sum(1 for d in decisions if d.classification == "auto"),
                    "escalate_count": sum(1 for d in decisions if d.classification == "escalate"),
                    "block_count": sum(1 for d in decisions if d.classification == "block"),
                },
                risk_classification="high" if any(d.classification == "escalate" for d in decisions) else "low",
                decision_rationale="Governance evaluation of InsightReport recommendations and anomalies",
            )

        return decisions

    def _evaluate(self, decision_input: dict) -> GovernanceDecision:
        """Evaluate a single item against the policy rules (top-down, first match wins)."""
        for rule in self.policy["rules"]:
            if self._matches(rule["matches"], decision_input):
                return GovernanceDecision(
                    classification=rule["classification"],
                    rule_id=rule["id"],
                    rationale_cz=rule["rationale_cz"],
                    compliance_refs=rule.get("compliance_refs", []),
                    original_item=decision_input,
                )
        # Should never reach here if default rule exists
        return GovernanceDecision(
            classification="auto",
            rule_id="fallback",
            rationale_cz="Žádné pravidlo neodpovídá — automaticky schváleno.",
            compliance_refs=[],
            original_item=decision_input,
        )

    def _matches(self, matchers: dict, decision_input: dict) -> bool:
        """Check if all matchers match the decision input. Empty matchers = default rule."""
        if not matchers:
            return True
        for key, expected in matchers.items():
            if key == "keywords_cz":
                text = decision_input.get("text_cz", "").lower()
                if not any(kw.lower() in text for kw in expected):
                    return False
            else:
                if decision_input.get(key) != expected:
                    return False
        return True
