"""End-to-end pipeline orchestrator.

Wires all 8 layers end-to-end:
Ingestion → PII Redaction → Categorization → Anomaly → Insight →
Governance Gate (Auto/Escalate/Block) → Report Composer → Audit Logger
Single entry point: run(persona_id) → GeorgeAppReport
"""

import json
import time
from pathlib import Path

from agents.ingestion import IngestionAgent
from agents.pii_redaction import PIIRedactor
from agents.categorization import CategorizationAgent
from agents.anomaly import AnomalyAgent
from agents.insight import InsightAgent
from agents.governance import GovernanceGate
from agents.report_composer import ReportComposer
from agents.audit_logger import AuditLogger


class Pipeline:
    def __init__(self, samples_dir: str = "data/samples",
                 categorization_strategy: str = "rules",
                 audit_db_path: str = "audit.db"):
        self.audit = AuditLogger(db_path=audit_db_path)
        self.ingestion = IngestionAgent(samples_dir=samples_dir, audit=self.audit)
        self.categorizer = CategorizationAgent(strategy=categorization_strategy, audit=self.audit)
        self.anomaly = AnomalyAgent(audit=self.audit)
        self.insight = InsightAgent(audit=self.audit)
        self.governance = GovernanceGate(
            policy_path=str(Path(samples_dir).parent.parent / "policies" / "default.yaml"),
            audit=self.audit
        )
        self.composer = ReportComposer(audit=self.audit)

    def run(self, persona_id: str) -> dict:
        """Run the full pipeline for a persona. Returns GeorgeAppReport as dict."""
        start = time.time()

        # Layer 1 — Ingestion
        transactions = self.ingestion.fetch(persona_id)

        # Layer 2 — PII Redaction
        account_name = transactions[0].get("account_holder_name", "") if transactions else ""
        redactor = PIIRedactor(known_names=[account_name] if account_name else [])
        redacted = [redactor.redact_transaction(tx) for tx in transactions]

        # Count PII leakage (should be 0)
        pii_leakage = 0
        for orig, red in zip(transactions, redacted):
            serialized = json.dumps(red)
            if orig.get("iban", "") and orig["iban"] in serialized:
                pii_leakage += 1
            if account_name and account_name in serialized:
                pii_leakage += 1

        # Layer 3 — Categorization (on redacted transactions)
        categories = self.categorizer.categorize(redacted, persona_id=persona_id)

        # Layer 4 — Anomaly Detection (on original transactions for amount accuracy)
        anomalies = self.anomaly.detect(transactions)

        # Layer 5 — Insight (Czech narrative)
        insight = self.insight.generate(
            persona_id=persona_id,
            transactions=redacted,
            categories=categories,
            anomalies=anomalies,
        )

        # Layer 8 — Governance Gate (Auto/Escalate/Block)
        governance_decisions = self.governance.evaluate_report(insight)

        # Mark escalated recommendations in the insight report
        for decision in governance_decisions:
            if decision.classification == "escalate" and decision.original_item.get("type") == "recommendation":
                # Find matching recommendation and mark it
                for rec in insight.recommendations_cz:
                    if rec.get("text_cz", "") in decision.original_item.get("text_cz", ""):
                        rec["requires_approval"] = True
                        rec["governance_status"] = "escalated"
                        rec["governance_rationale"] = decision.rationale_cz

        # Layer 6 — Report Composer
        elapsed = time.time() - start
        report = self.composer.compose(
            insight_report=insight,
            categories=categories,
            anomalies=anomalies,
            generation_time_s=elapsed,
            pii_leakage_count=pii_leakage,
        )

        return report.model_dump(mode="json")
