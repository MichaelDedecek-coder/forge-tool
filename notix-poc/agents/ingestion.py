"""Layer 1 — Ingestion Agent.

In the spike, this is a stub that reads from data/samples/*.json.
In the production POC, it would call the real ČS core banking API
(NOTIX owns the integration).
"""

import json
from pathlib import Path
from typing import Any


class IngestionAgent:
    LAYER_NAME = "ingestion"

    def __init__(self, samples_dir: str, audit=None):
        self.samples_dir = Path(samples_dir)
        self.audit = audit

    def fetch(self, persona_id: str) -> list[dict[str, Any]]:
        path = self.samples_dir / f"{persona_id}.json"
        if not path.exists():
            raise ValueError(f"Unknown persona: {persona_id}")

        with path.open() as f:
            data = json.load(f)

        # Sample files wrap transactions in a top-level object
        if isinstance(data, dict) and "transactions" in data:
            transactions = data["transactions"]
        else:
            transactions = data

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="fetch",
                persona_id=persona_id,
                metadata={"count": len(transactions)},
            )

        return transactions
