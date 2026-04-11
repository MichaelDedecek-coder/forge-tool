# NOTIX POC Banking Agent — 10-Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a running 8-layer banking customer insight agent (transaction analysis → personalized Czech-language financial briefing) with embedded AI Act / GDPR / DORA governance, plus all supporting meeting materials, by 2026-04-20 evening — so Steve can show capability + secure paid NOTIX engagement (HPP 200k CZK/mo via 4-6 week paid POC) at the 2026-04-21 meeting.

**Architecture:** 8 layers as Python agents (Ingestion → PII Redaction → Categorization → Anomaly → Insight → Report Composer → Audit Logger → Governance gate). Each layer is a self-contained module with a clear input/output contract. Cross-cutting Audit Logger writes to append-only SQLite log. Governance layer is a YAML rules engine that classifies decisions Auto / Escalate / Block. FastAPI exposes a single `POST /api/poc/analyze` endpoint. Next.js UI shows the generated Czech report and the governance approval queue.

**Tech Stack:**
- **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLite (audit log), pytest, uv (deps)
- **LLM:** Anthropic Claude API directly (Claude Agent SDK is heavyweight for spike; Bedrock Frankfurt comes in the production POC, not the spike)
- **Data:** Synthetic Czech banking transactions (custom generator, deterministic with seed)
- **UI:** Next.js 14 App Router (one app under `notix-poc/ui/`)
- **Infra:** `docker-compose up` for local reproducibility
- **Repo location:** `forge-tool/notix-poc/` (subdirectory of the existing forge-tool repo, locked in spec §4.1)
- **Git workflow:** local branch `feat/notix-poc-banking-agent` → push to remote of same name (locked in spec §13)
- **Output language:** all customer-facing report text in Czech only (locked in spec §8)

**Spec reference:** [docs/superpowers/specs/2026-04-11-notix-poc-design.md](../specs/2026-04-11-notix-poc-design.md)

**Memory references:**
- `~/.claude/projects/-Users-michaeldedecek-forge-tool/memory/project_notix_meeting.md` — meeting strategy, employment pitch, IP red lines
- `~/.claude/projects/-Users-michaeldedecek-forge-tool/CLAUDE.md` — three-layer enterprise pitch pattern, positioning hook

---

## Calendar overview

| Day | Date | Day-of-week | Focus | Steve's role | Claude's role |
|---|---|---|---|---|---|
| 0 | 2026-04-11 | Sat evening | Bootstrap project structure | review | execute |
| 2 | 2026-04-12 | Sun | Data + Layers 1, 2, 7-skeleton | review | execute |
| 3 | 2026-04-13 | Mon | Layer 3 (Categorization) | **pitch prep** | code in parallel |
| 4 | 2026-04-14 | Tue | Layers 4, 5 | review | execute |
| 5 | 2026-04-15 | Wed | Layers 6, 7 (full), UI scaffold | review | execute |
| 6 | 2026-04-16 | Thu | Layer 8 (Governance), e2e | review | execute |
| 7 | 2026-04-17 | Fri | IP carve-out draft + spike polish | **co-write IP draft** | execute |
| 8 | 2026-04-18 | Sat | Metrics, screencast, deck v3 | **deck owner** | execute spike side |
| 9 | 2026-04-19 | Sun | Dry run rehearsal + Q&A prep | **rehearse** | simulate Jiří + Petr |
| 10 | 2026-04-20 | Mon | Buffer — printed materials, checklist | **light review, early sleep** | standby |
| Meeting | 2026-04-21 | Tue 10:00 | Meeting at Pacovská 1 Praha 4 | **deliver** | standby |

**TDD policy:**
- **Strict TDD** for: PII Redaction (Layer 2), Categorization (Layer 3), Anomaly (Layer 4), Governance (Layer 8). These are correctness-critical and easy to test.
- **Pragmatic TDD** for: Insight Agent (Layer 5), Report Composer (Layer 6), Audit Logger (Layer 7). LLM/formatter outputs tested via golden samples + structural assertions, not exact-string matching.
- **Integration testing** for: Ingestion (Layer 1, stub), FastAPI plumbing, Next.js UI. Tested end-to-end, not unit-level.

---

## Pre-flight — Day 1 evening (Sat 11.4.)

### Task 0.1: Bootstrap notix-poc/ project structure

**Files:**
- Create: `notix-poc/README.md`
- Create: `notix-poc/pyproject.toml`
- Create: `notix-poc/.env.example`
- Create: `notix-poc/.gitignore`
- Create: `notix-poc/docker-compose.yml`
- Create: `notix-poc/api/__init__.py`
- Create: `notix-poc/api/main.py`
- Create: `notix-poc/agents/__init__.py`
- Create: `notix-poc/data/__init__.py`
- Create: `notix-poc/policies/default.yaml`
- Create: `notix-poc/tests/__init__.py`
- Create: `notix-poc/tests/conftest.py`

- [ ] **Step 1: Create directory tree**

Run from `/Users/michaeldedecek/forge-tool/.claude/worktrees/notix-poc`:

```bash
mkdir -p notix-poc/{api,agents,data/samples,policies,tests,scripts,ui}
```

- [ ] **Step 2: Write `notix-poc/pyproject.toml`**

```toml
[project]
name = "notix-poc"
version = "0.1.0"
description = "Banking customer insight agent with embedded AI governance — NOTIX POC spike"
requires-python = ">=3.11"
dependencies = [
    "anthropic>=0.40.0",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.9.0",
    "pyyaml>=6.0.0",
    "python-dotenv>=1.0.0",
    "httpx>=0.27.0",
]

[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "ruff>=0.7.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"

[tool.ruff]
line-length = 100
target-version = "py311"
```

- [ ] **Step 3: Write `notix-poc/.env.example`**

```bash
# Required for all LLM-backed layers (Categorization, Insight)
ANTHROPIC_API_KEY=sk-ant-...

# Audit log database path (SQLite)
AUDIT_LOG_DB=./audit.db

# Governance policy file
GOVERNANCE_POLICY_PATH=./policies/default.yaml

# Random seed for synthetic data generator (deterministic personas)
SYNTHETIC_DATA_SEED=42
```

- [ ] **Step 4: Write `notix-poc/.gitignore`**

```gitignore
# Python
__pycache__/
*.py[cod]
*.so
.Python
.venv/
venv/
.pytest_cache/
.ruff_cache/
*.egg-info/

# Environment
.env
.env.local

# Audit log artifacts (SQLite + sidecar files)
*.db
*.db-journal
*.db-wal
*.db-shm

# Generated screencasts and large samples
screencasts/
data/samples/large_*.json

# Node (for ui/)
node_modules/
.next/
out/
```

- [ ] **Step 5: Write `notix-poc/README.md`**

```markdown
# NOTIX POC — Banking Customer Insight Agent

10-day spike for the NOTIX meeting on 2026-04-21. See `../docs/superpowers/specs/2026-04-11-notix-poc-design.md` for the full design spec, and `../docs/superpowers/plans/2026-04-11-notix-poc-banking-agent.md` for the implementation plan.

## What this is

An 8-layer agent that takes a synthetic Česká spořitelna customer transaction stream and produces a personalized Czech-language financial briefing. Every decision passes through a Human-above-the-Loop governance gate (Auto-Execute / Escalate / Block) and is written to an append-only audit log for AI Act / DORA compliance.

This is a **technical spike**, not a finished POC. It demonstrates capability and velocity. The 4-6 week paid POC builds a production-grade implementation on AWS Bedrock Frankfurt.

## Run locally

```bash
# 1. Install Python deps
uv sync

# 2. Set env vars
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY

# 3. Generate synthetic data
python -m data.transaction_generator

# 4. Start API
uvicorn api.main:app --reload --port 8000

# 5. (Optional) Start UI in another terminal
cd ui && npm install && npm run dev
```

## Architecture

8 layers:
1. **Ingestion Agent** — synthetic ČS API stub
2. **PII Redaction Layer** — strips PII before LLM
3. **Categorization Agent** — LLM transaction classifier (Czech)
4. **Anomaly Agent** — fraud + unusual spend detection
5. **Insight Agent** — Czech narrative generator
6. **Report Composer** — formats output for George app contract
7. **Audit Logger** — append-only SQLite log
8. **Governance Gate** — Auto / Escalate / Block rules engine

See spec doc §3 for the data flow diagram.

## Compliance framing

| Layer | Compliance article |
|---|---|
| 2 (PII Redaction) | GDPR Art. 5(1)(c) data minimization |
| 7 (Audit Logger) | AI Act Art. 12, DORA Art. 11 |
| 8 (Governance) | AI Act Art. 14 human oversight |

See spec doc §6 for the full compliance map.

## Demo (target)

```
$ docker-compose up -d
$ python scripts/run_e2e.py persona-c
[1/8] Ingestion: 90 days, 247 transactions
[2/8] PII Redaction: 0 leaks across 247 records
[3/8] Categorization: 247/247 classified (avg 0.18s)
[4/8] Anomaly: 3 flags (1 critical: card-not-present €890)
[5/8] Insight: report draft ready
[6/8] Governance: 1 escalation (fraud flag → human approval)
[7/8] Audit: 14 events logged
[8/8] Report Composer: persona-c-report.md ready

→ Open http://localhost:3000 to view the report and governance queue.
```
```

- [ ] **Step 6: Write `notix-poc/docker-compose.yml`**

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - AUDIT_LOG_DB=/data/audit.db
      - GOVERNANCE_POLICY_PATH=/app/policies/default.yaml
    volumes:
      - ./policies:/app/policies:ro
      - audit-data:/data

  ui:
    build:
      context: ./ui
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - api

volumes:
  audit-data:
```

(Dockerfiles come in Day 8 polish — for the spike, local `uvicorn` and `npm run dev` are the primary path.)

- [ ] **Step 7: Write minimal stubs for Python packages**

```bash
touch notix-poc/api/__init__.py
touch notix-poc/agents/__init__.py
touch notix-poc/data/__init__.py
touch notix-poc/tests/__init__.py
```

- [ ] **Step 8: Write `notix-poc/api/main.py` (empty FastAPI app)**

```python
"""NOTIX POC FastAPI entry point.

Single endpoint POST /api/poc/analyze takes a persona ID and runs
the 8-layer pipeline. UI hits this endpoint.
"""

from fastapi import FastAPI

app = FastAPI(
    title="NOTIX POC — Banking Customer Insight Agent",
    description="8-layer agent with embedded AI Act / GDPR / DORA governance",
    version="0.1.0",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 9: Write `notix-poc/policies/default.yaml` (empty governance policy stub)**

```yaml
# Governance policy for Layer 8 (Human-above-the-Loop gate).
# Each rule classifies an agent decision as: auto | escalate | block
# Decisions are evaluated top-down; first match wins.
# Full content lands in Day 6 (Task 6.1).

version: 1
rules: []
```

- [ ] **Step 10: Write `notix-poc/tests/conftest.py` (pytest fixtures stub)**

```python
"""Shared pytest fixtures for the notix-poc spike.

Real fixtures (mock LLM, sample personas, in-memory audit DB) are added
as the corresponding layers are implemented.
"""
```

- [ ] **Step 11: Verify the structure**

```bash
cd /Users/michaeldedecek/forge-tool/.claude/worktrees/notix-poc
find notix-poc -type f -not -path '*/node_modules/*' | sort
```

Expected output (12 files):

```
notix-poc/.env.example
notix-poc/.gitignore
notix-poc/README.md
notix-poc/agents/__init__.py
notix-poc/api/__init__.py
notix-poc/api/main.py
notix-poc/data/__init__.py
notix-poc/docker-compose.yml
notix-poc/policies/default.yaml
notix-poc/pyproject.toml
notix-poc/tests/__init__.py
notix-poc/tests/conftest.py
```

- [ ] **Step 12: Commit**

```bash
cd /Users/michaeldedecek/forge-tool/.claude/worktrees/notix-poc
git add notix-poc/
git commit -m "feat(notix-poc): bootstrap project structure (8 layers, FastAPI, SQLite audit)

Initial scaffold for the NOTIX POC banking agent spike.
Empty stubs for all layers; real implementations land in Day 2-6.

See docs/superpowers/plans/2026-04-11-notix-poc-banking-agent.md
for the full 10-day plan.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Day 2 — Sunday 2026-04-12 (Synthetic data + Layers 1, 2, 7-skeleton)

### Task 2.1: Synthetic Czech transaction data generator (3 personas)

**Files:**
- Create: `notix-poc/data/personas.py`
- Create: `notix-poc/data/transaction_generator.py`
- Create: `notix-poc/data/samples/persona_a.json` (generated artifact, committed for repeatability)
- Create: `notix-poc/data/samples/persona_b.json`
- Create: `notix-poc/data/samples/persona_c.json`
- Test: `notix-poc/tests/test_transaction_generator.py`

- [ ] **Step 1: Define personas in `data/personas.py`**

```python
"""Three synthetic ČS customer profiles.

Each persona has a deterministic spending fingerprint that drives
the synthetic transaction generator.
"""

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class Persona:
    id: str
    label_cz: str
    age: int
    city: str
    monthly_income_czk: Decimal
    monthly_recurring_categories: dict[str, Decimal] = field(default_factory=dict)
    discretionary_categories: list[str] = field(default_factory=list)
    triggered_scenarios: list[str] = field(default_factory=list)


PERSONA_A = Persona(
    id="persona-a",
    label_cz="Mladý profesionál",
    age=28,
    city="Praha",
    monthly_income_czk=Decimal("60000"),
    monthly_recurring_categories={
        "Bydlení": Decimal("18000"),
        "Předplatné": Decimal("1500"),
        "Doprava (MHD)": Decimal("550"),
    },
    discretionary_categories=["Restaurace", "Cestování", "Elektronika", "Sport"],
    triggered_scenarios=["investment_recommendation"],
)

PERSONA_B = Persona(
    id="persona-b",
    label_cz="Rodina s dětmi",
    age=38,
    city="Brno",
    monthly_income_czk=Decimal("110000"),
    monthly_recurring_categories={
        "Hypotéka": Decimal("28000"),
        "Energie": Decimal("4500"),
        "Děti (školka, kroužky)": Decimal("8000"),
        "Auto (leasing + pojištění)": Decimal("12000"),
    },
    discretionary_categories=["Potraviny", "Drogerie", "Dovolená", "Domácnost"],
    triggered_scenarios=["high_value_anomaly"],
)

PERSONA_C = Persona(
    id="persona-c",
    label_cz="Senior",
    age=67,
    city="Nový Bor",
    monthly_income_czk=Decimal("25000"),
    monthly_recurring_categories={
        "Energie": Decimal("3200"),
        "Léky a zdravotnictví": Decimal("1800"),
    },
    discretionary_categories=["Potraviny", "Dárky", "Drobné nákupy"],
    triggered_scenarios=["fraud_card_not_present"],
)

ALL_PERSONAS = [PERSONA_A, PERSONA_B, PERSONA_C]
```

- [ ] **Step 2: Write the failing test for the transaction generator**

`notix-poc/tests/test_transaction_generator.py`:

```python
"""Tests for the synthetic transaction generator.

We assert structural contracts (shape, ranges, persona-specific
characteristics) rather than exact values, so the test stays stable
across generator tweaks.
"""

import pytest
from datetime import date

from data.personas import PERSONA_A, PERSONA_B, PERSONA_C
from data.transaction_generator import generate_transactions, Transaction


def test_generates_at_least_one_transaction_per_persona():
    txs = generate_transactions(PERSONA_A, days=90, seed=42)
    assert len(txs) > 0


def test_all_records_match_transaction_shape():
    txs = generate_transactions(PERSONA_A, days=90, seed=42)
    for tx in txs:
        assert isinstance(tx, Transaction)
        assert isinstance(tx.date, date)
        assert tx.amount_czk > 0
        assert tx.merchant
        assert tx.mcc_code
        assert tx.currency == "CZK"
        # Each tx must carry PII for the redaction layer to strip
        assert tx.account_holder_name
        assert tx.iban


def test_seed_is_deterministic():
    a = generate_transactions(PERSONA_A, days=30, seed=42)
    b = generate_transactions(PERSONA_A, days=30, seed=42)
    assert [t.amount_czk for t in a] == [t.amount_czk for t in b]


def test_persona_c_has_pharmacy_transactions():
    """Senior persona must have realistic pharmacy spend."""
    txs = generate_transactions(PERSONA_C, days=90, seed=42)
    pharmacy = [t for t in txs if "lékárna" in t.merchant.lower() or t.mcc_code == "5912"]
    assert len(pharmacy) >= 3


def test_persona_c_triggers_fraud_scenario():
    """Persona C has fraud_card_not_present triggered — at least one such tx must appear."""
    txs = generate_transactions(PERSONA_C, days=90, seed=42)
    fraud = [t for t in txs if t.scenario_marker == "fraud_card_not_present"]
    assert len(fraud) >= 1
    # Fraud tx should be card-not-present (online), high value relative to persona
    assert fraud[0].card_present is False
    assert fraud[0].amount_czk >= Decimal("5000")


def test_persona_a_triggers_investment_recommendation_scenario():
    txs = generate_transactions(PERSONA_A, days=90, seed=42)
    inv = [t for t in txs if t.scenario_marker == "investment_recommendation"]
    assert len(inv) >= 1


def test_persona_b_triggers_high_value_anomaly_scenario():
    txs = generate_transactions(PERSONA_B, days=90, seed=42)
    anom = [t for t in txs if t.scenario_marker == "high_value_anomaly"]
    assert len(anom) >= 1
    # High-value anomaly = 3x larger than persona's typical max
    assert anom[0].amount_czk >= Decimal("50000")
```

- [ ] **Step 3: Run tests, expect failures**

```bash
cd notix-poc
uv run pytest tests/test_transaction_generator.py -v
```

Expected: `ImportError` (transaction_generator module doesn't exist yet) or all tests fail.

- [ ] **Step 4: Implement `data/transaction_generator.py`**

Define the `Transaction` dataclass and `generate_transactions(persona, days, seed)` function. Use Python's `random` module seeded for determinism. Pull merchant name pools from a small in-file dictionary keyed by category. Inject scenario triggers based on `persona.triggered_scenarios`.

Key contract:
```python
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
import random

from data.personas import Persona


@dataclass
class Transaction:
    date: date
    merchant: str
    amount_czk: Decimal
    mcc_code: str
    currency: str
    account_holder_name: str  # PII — to be redacted in Layer 2
    iban: str                 # PII — to be redacted in Layer 2
    card_present: bool
    scenario_marker: str | None = None  # "fraud_card_not_present" | "investment_recommendation" | "high_value_anomaly" | None


def generate_transactions(persona: Persona, days: int, seed: int = 42) -> list[Transaction]:
    """Generate `days` of synthetic transactions for `persona`, seeded for determinism."""
    rng = random.Random(seed + hash(persona.id))
    transactions: list[Transaction] = []

    # Recurring transactions (monthly)
    # Discretionary transactions (random per category)
    # Scenario-triggered transactions (one per scenario, planted at random day)
    # ... implementation ...

    return sorted(transactions, key=lambda t: t.date)
```

(Full implementation expanded during execution; ~150-200 lines.)

- [ ] **Step 5: Run tests, expect pass**

```bash
uv run pytest tests/test_transaction_generator.py -v
```

Expected: all 7 tests PASS.

- [ ] **Step 6: Generate sample datasets and save to `data/samples/`**

```bash
uv run python -m data.transaction_generator
```

This should run a `if __name__ == "__main__":` block that writes `persona_a.json`, `persona_b.json`, `persona_c.json` to `data/samples/`. Each file is a JSON array of transaction dicts.

- [ ] **Step 7: Spot-check generated samples**

```bash
jq 'length' data/samples/persona_c.json
# Expect: ~250-300 transactions

jq '[.[] | select(.scenario_marker == "fraud_card_not_present")] | length' data/samples/persona_c.json
# Expect: 1
```

- [ ] **Step 8: Commit**

```bash
git add notix-poc/data/ notix-poc/tests/test_transaction_generator.py
git commit -m "feat(notix-poc): synthetic Czech transaction generator + 3 personas

3 deterministic personas (mladý profesionál, rodina, senior) each with
~90 days of realistic Czech banking transactions. Each persona triggers
exactly one governance-relevant scenario for the Day 6 demo:
- Persona A → investment_recommendation
- Persona B → high_value_anomaly
- Persona C → fraud_card_not_present

Tests: 7 passing.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 2.2: Layer 1 — Ingestion Agent (synthetic ČS API stub)

**Files:**
- Create: `notix-poc/agents/ingestion.py`
- Test: `notix-poc/tests/test_ingestion.py`

- [ ] **Step 1: Write the failing test**

```python
"""Layer 1 — Ingestion Agent reads transactions for a given persona ID
from the synthetic data store, mimicking a ČS core banking API call.
"""

import pytest
from agents.ingestion import IngestionAgent


@pytest.fixture
def agent():
    return IngestionAgent(samples_dir="data/samples")


def test_returns_transactions_for_known_persona(agent):
    txs = agent.fetch("persona-a")
    assert len(txs) > 0
    for tx in txs:
        assert "merchant" in tx
        assert "amount_czk" in tx


def test_raises_for_unknown_persona(agent):
    with pytest.raises(ValueError, match="Unknown persona"):
        agent.fetch("persona-z")


def test_emits_audit_event_per_fetch(agent, audit_log):
    agent.fetch("persona-a")
    events = audit_log.events_for_layer("ingestion")
    assert len(events) == 1
    assert events[0].action == "fetch"
    assert events[0].persona_id == "persona-a"
```

(`audit_log` fixture is added in Task 2.4 below.)

- [ ] **Step 2: Run test, expect failures (module missing)**

```bash
uv run pytest tests/test_ingestion.py -v
```

- [ ] **Step 3: Implement `agents/ingestion.py`**

```python
"""Layer 1 — Ingestion Agent.

In the spike, this is a stub that reads from `data/samples/*.json`.
In the production POC, it would call the real ČS core banking API
(NOTIX owns the integration).
"""

import json
from pathlib import Path
from typing import Any

from agents.audit_logger import AuditLogger


class IngestionAgent:
    LAYER_NAME = "ingestion"

    def __init__(self, samples_dir: str, audit: AuditLogger | None = None):
        self.samples_dir = Path(samples_dir)
        self.audit = audit

    def fetch(self, persona_id: str) -> list[dict[str, Any]]:
        path = self.samples_dir / f"{persona_id}.json"
        if not path.exists():
            raise ValueError(f"Unknown persona: {persona_id}")

        with path.open() as f:
            transactions = json.load(f)

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="fetch",
                persona_id=persona_id,
                metadata={"count": len(transactions)},
            )

        return transactions
```

- [ ] **Step 4: Run tests, expect pass**

(After Task 2.4 audit logger is in place, this will be green. For now skip the audit-event test or mark `xfail`.)

- [ ] **Step 5: Commit**

```bash
git add notix-poc/agents/ingestion.py notix-poc/tests/test_ingestion.py
git commit -m "feat(notix-poc): Layer 1 Ingestion Agent (synthetic ČS API stub)

Reads pre-generated transactions from data/samples/<persona>.json.
Production POC replaces this with the real ČS core banking API call
(NOTIX owns the integration). Audit hook in place but inert until
Task 2.4 lands the AuditLogger.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 2.3: Layer 2 — PII Redaction Layer (TDD strict)

**Files:**
- Create: `notix-poc/agents/pii_redaction.py`
- Test: `notix-poc/tests/test_pii_redaction.py`

- [ ] **Step 1: Write the failing test for IBAN redaction**

```python
"""Layer 2 — PII Redaction Layer strips Czech PII before any data
reaches an LLM. GDPR Art. 5(1)(c) data minimization compliance is
the contract: leakage count MUST be 0.
"""

import pytest
from agents.pii_redaction import PIIRedactor


def test_redacts_iban():
    redactor = PIIRedactor()
    text = "Platba na účet CZ6508000000192000145399 byla úspěšná."
    result = redactor.redact_text(text)
    assert "CZ6508000000192000145399" not in result
    assert "[IBAN_REDACTED]" in result
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
uv run pytest tests/test_pii_redaction.py::test_redacts_iban -v
```

Expected: `ImportError` or `AttributeError`.

- [ ] **Step 3: Implement minimal IBAN redaction**

```python
"""Layer 2 — PII Redaction Layer.

Strips Czech PII (names, account numbers, IBAN, birth numbers / RČ,
phone numbers) from any string or transaction record before it leaves
the system to an LLM. Counts every redaction so we can assert
leakage = 0 in the spike metrics.
"""

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class RedactionResult:
    text: str
    redactions_by_type: dict[str, int] = field(default_factory=dict)

    @property
    def total(self) -> int:
        return sum(self.redactions_by_type.values())


class PIIRedactor:
    # Czech IBAN: CZ + 22 digits (with optional spaces)
    IBAN_RE = re.compile(r"\bCZ\s?\d{2}\s?(?:\d{4}\s?){5}\b")

    # Czech RČ: 6 digits / 3-4 digits (e.g., 850101/2345 or 8501012345)
    RC_RE = re.compile(r"\b\d{6}\s?/?\s?\d{3,4}\b")

    # Czech phone: +420 NNN NNN NNN or 9 digits
    PHONE_RE = re.compile(r"(?:\+420\s?)?\d{3}\s?\d{3}\s?\d{3}\b")

    # Account number: NNN-NNNNNNNNNN/NNNN or NNNNNNNNNN/NNNN
    ACCOUNT_RE = re.compile(r"\b\d{1,6}-?\d{6,10}/\d{4}\b")

    # Names — handled via a small lookup table seeded with the persona
    # account_holder_name field. The redactor is constructed with a list
    # of "known names to strip" so it doesn't need a full Czech name NER.

    def __init__(self, known_names: list[str] | None = None):
        self.known_names = known_names or []

    def redact_text(self, text: str) -> str:
        return self.redact_with_counts(text).text

    def redact_with_counts(self, text: str) -> RedactionResult:
        counts: dict[str, int] = {}

        text, n = self.IBAN_RE.subn("[IBAN_REDACTED]", text)
        if n:
            counts["iban"] = n

        text, n = self.RC_RE.subn("[RC_REDACTED]", text)
        if n:
            counts["rc"] = n

        text, n = self.PHONE_RE.subn("[PHONE_REDACTED]", text)
        if n:
            counts["phone"] = n

        text, n = self.ACCOUNT_RE.subn("[ACCOUNT_REDACTED]", text)
        if n:
            counts["account"] = n

        for name in self.known_names:
            count_before = text.count(name)
            text = text.replace(name, "[NAME_REDACTED]")
            if count_before:
                counts["name"] = counts.get("name", 0) + count_before

        return RedactionResult(text=text, redactions_by_type=counts)
```

- [ ] **Step 4: Run test, expect PASS**

```bash
uv run pytest tests/test_pii_redaction.py::test_redacts_iban -v
```

- [ ] **Step 5: Add tests for RČ, phone, account, name, and a transaction-level redaction**

```python
def test_redacts_rc():
    redactor = PIIRedactor()
    result = redactor.redact_with_counts("Klient 850101/2345 si vyžádal výpis.")
    assert "850101/2345" not in result.text
    assert result.redactions_by_type["rc"] == 1


def test_redacts_phone():
    redactor = PIIRedactor()
    result = redactor.redact_with_counts("Volejte +420 777 123 456")
    assert "777 123 456" not in result.text
    assert "+420" not in result.text
    assert result.redactions_by_type["phone"] == 1


def test_redacts_known_name():
    redactor = PIIRedactor(known_names=["Jan Novák"])
    result = redactor.redact_with_counts("Pan Jan Novák provedl platbu.")
    assert "Jan Novák" not in result.text
    assert result.redactions_by_type["name"] == 1


def test_redacts_full_transaction_record():
    """Layer 2 must accept a transaction dict and return one with PII removed."""
    redactor = PIIRedactor(known_names=["Jan Novák"])
    tx = {
        "merchant": "Albert",
        "amount_czk": 450,
        "account_holder_name": "Jan Novák",
        "iban": "CZ6508000000192000145399",
        "memo": "Platba kartou Jan Novák, IBAN CZ6508000000192000145399",
    }
    redacted = redactor.redact_transaction(tx)
    serialized = str(redacted)
    assert "Jan Novák" not in serialized
    assert "CZ6508000000192000145399" not in serialized


def test_zero_leakage_on_full_persona_data():
    """The spike's headline metric: across all 247 persona-c transactions,
    PII leakage count = 0 after redaction."""
    import json
    from agents.ingestion import IngestionAgent

    agent = IngestionAgent(samples_dir="data/samples")
    transactions = agent.fetch("persona-c")
    redactor = PIIRedactor(
        known_names=[tx["account_holder_name"] for tx in transactions[:1]]
    )

    leaked = 0
    for tx in transactions:
        redacted = redactor.redact_transaction(tx)
        serialized = json.dumps(redacted)
        if tx["iban"] in serialized:
            leaked += 1
        if tx["account_holder_name"] in serialized:
            leaked += 1

    assert leaked == 0, f"PII leakage = {leaked} (expected 0)"
```

- [ ] **Step 6: Implement `redact_transaction(tx)` method**

```python
def redact_transaction(self, tx: dict[str, Any]) -> dict[str, Any]:
    redacted = {}
    for key, value in tx.items():
        if key == "iban":
            redacted[key] = "[IBAN_REDACTED]"
        elif key == "account_holder_name":
            redacted[key] = "[NAME_REDACTED]"
        elif isinstance(value, str):
            redacted[key] = self.redact_text(value)
        else:
            redacted[key] = value
    return redacted
```

- [ ] **Step 7: Run all PII tests, expect PASS**

```bash
uv run pytest tests/test_pii_redaction.py -v
```

- [ ] **Step 8: Commit**

```bash
git add notix-poc/agents/pii_redaction.py notix-poc/tests/test_pii_redaction.py
git commit -m "feat(notix-poc): Layer 2 PII Redaction (zero-leakage Czech)

Strips IBAN, RČ, phone, account number, and known account holder names.
Strict TDD — every redaction type has a failing-then-passing test.
Headline metric: zero PII leakage across full persona-c sample (247 tx).

GDPR Art. 5(1)(c) data minimization compliance is enforced at this
boundary — no data passes to an LLM with PII intact.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 2.4: Layer 7 — Audit Logger skeleton (so subsequent layers can write)

**Files:**
- Create: `notix-poc/agents/audit_logger.py`
- Test: `notix-poc/tests/test_audit_logger.py`
- Modify: `notix-poc/tests/conftest.py` (add `audit_log` fixture)

- [ ] **Step 1: Write failing test for append-only event logging**

```python
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
```

- [ ] **Step 2: Run test, expect FAIL**

- [ ] **Step 3: Implement minimal SQLite-backed AuditLogger**

```python
"""Layer 7 — Audit Logger (append-only SQLite)."""

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass
class AuditEvent:
    id: int
    timestamp: datetime
    layer: str
    action: str
    persona_id: str | None
    metadata: dict[str, Any]


class AuditLogger:
    SCHEMA = """
    CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        layer TEXT NOT NULL,
        action TEXT NOT NULL,
        persona_id TEXT,
        metadata TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_layer ON audit_events(layer);
    CREATE INDEX IF NOT EXISTS idx_persona ON audit_events(persona_id);
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript(self.SCHEMA)

    def log_event(
        self,
        layer: str,
        action: str,
        persona_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> int:
        ts = datetime.now(timezone.utc).isoformat()
        meta_json = json.dumps(metadata or {})
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO audit_events (timestamp, layer, action, persona_id, metadata) "
                "VALUES (?, ?, ?, ?, ?)",
                (ts, layer, action, persona_id, meta_json),
            )
            return cursor.lastrowid

    def events_for_layer(self, layer: str) -> list[AuditEvent]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT id, timestamp, layer, action, persona_id, metadata "
                "FROM audit_events WHERE layer = ? ORDER BY id ASC",
                (layer,),
            ).fetchall()
        return [
            AuditEvent(
                id=row[0],
                timestamp=datetime.fromisoformat(row[1]),
                layer=row[2],
                action=row[3],
                persona_id=row[4],
                metadata=json.loads(row[5]),
            )
            for row in rows
        ]

    def delete_event(self, event_id: int):
        raise NotImplementedError("Audit log is append-only (DORA Art. 11)")

    def update_event(self, event_id: int, fields: dict[str, Any]):
        raise NotImplementedError("Audit log is append-only (DORA Art. 11)")
```

- [ ] **Step 4: Run tests, expect PASS**

- [ ] **Step 5: Add `audit_log` fixture to `tests/conftest.py`**

```python
import pytest
from agents.audit_logger import AuditLogger


@pytest.fixture
def audit_log(tmp_path):
    return AuditLogger(db_path=str(tmp_path / "audit.db"))
```

- [ ] **Step 6: Re-run Task 2.2 ingestion tests with the audit fixture wired up**

```bash
uv run pytest tests/test_ingestion.py -v
```

All 3 ingestion tests should now PASS (the previously skipped audit-event test is green).

- [ ] **Step 7: Commit**

```bash
git add notix-poc/agents/audit_logger.py notix-poc/tests/test_audit_logger.py notix-poc/tests/conftest.py
git commit -m "feat(notix-poc): Layer 7 Audit Logger (append-only SQLite, DORA Art. 11)

Append-only event log with explicit deletion/update prohibition,
monotonic timestamps, and per-layer query helper. Spike-grade schema;
production POC adds DORA-specific fields (operation classification,
risk score, retention policy).

Other layers wire their audit hooks against this from now on.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Day 3 — Monday 2026-04-13 (Layer 3 — Categorization Agent)

**Steve's role today:** pitch prep — verify v2 deck claims (Managed Agents API, ES statistics, framework v2.1), add human-above-the-loop slide, sew Two Paths opening + Hook C + deck + close into a 20-min story.

**Claude's role today:** code Layer 3 in parallel, no demands on Steve's attention.

### Task 3.1: Layer 3 — Categorization Agent (LLM-based, Czech)

**Files:**
- Create: `notix-poc/agents/categorization.py`
- Create: `notix-poc/tests/test_categorization.py`
- Create: `notix-poc/tests/golden/categorization_samples.json`

- [ ] **Step 1: Define the canonical category set**

`agents/categorization.py`:

```python
"""Layer 3 — Categorization Agent.

LLM-based transaction classifier. Distinguishes "Lidl potraviny" vs
"Lidl elektro" (which MCC codes alone cannot). Returns one of a fixed
canonical category set.

Czech-language input and output. The LLM call is a single Anthropic
Claude API request per transaction batch (we batch up to 25 tx per
call to keep latency under control).
"""

CANONICAL_CATEGORIES = [
    "Bydlení",          # rent, mortgage
    "Energie",          # utilities
    "Potraviny",        # groceries
    "Drogerie",         # household / personal care
    "Restaurace",       # eating out
    "Doprava",          # transport (fuel, MHD, taxi)
    "Auto",             # car costs (lease, insurance, service)
    "Zdravotnictví",    # pharmacy, doctor
    "Vzdělání",         # books, courses
    "Cestování",        # travel
    "Dárky",            # gifts
    "Předplatné",       # subscriptions (Netflix, Spotify, etc.)
    "Elektronika",      # electronics
    "Sport",            # sports / fitness
    "Děti",             # kids' expenses
    "Investice",        # investment, securities
    "Drobné nákupy",    # misc small purchases
    "Ostatní",          # fallback
]
```

- [ ] **Step 2: Build the golden sample set**

`tests/golden/categorization_samples.json` (50 entries with `merchant`, `mcc_code`, expected `category`):

```json
[
  {"merchant": "Albert Praha 4", "mcc_code": "5411", "expected": "Potraviny"},
  {"merchant": "Lidl elektro", "mcc_code": "5732", "expected": "Elektronika"},
  {"merchant": "Lidl Brno", "mcc_code": "5411", "expected": "Potraviny"},
  {"merchant": "Lékárna Dr. Max", "mcc_code": "5912", "expected": "Zdravotnictví"},
  {"merchant": "ČEZ Distribuce", "mcc_code": "4900", "expected": "Energie"},
  {"merchant": "Spotify", "mcc_code": "5815", "expected": "Předplatné"}
  // ... 44 more entries spanning all 18 canonical categories
]
```

(Full 50 entries built during execution.)

- [ ] **Step 3: Write the failing accuracy test**

```python
import json
import pytest

from agents.categorization import CategorizationAgent

GOLDEN = json.load(open("tests/golden/categorization_samples.json"))


def test_categorization_accuracy_above_92_percent():
    agent = CategorizationAgent()
    correct = 0
    for sample in GOLDEN:
        result = agent.classify(merchant=sample["merchant"], mcc_code=sample["mcc_code"])
        if result.category == sample["expected"]:
            correct += 1
    accuracy = correct / len(GOLDEN)
    assert accuracy >= 0.92, f"Categorization accuracy {accuracy:.2%} below 92% target"


def test_returns_canonical_category(monkeypatch_anthropic):
    """Even if LLM returns garbage, output is constrained to canonical set."""
    agent = CategorizationAgent()
    result = agent.classify(merchant="Albert", mcc_code="5411")
    from agents.categorization import CANONICAL_CATEGORIES
    assert result.category in CANONICAL_CATEGORIES


def test_emits_audit_event_per_classification(audit_log):
    agent = CategorizationAgent(audit=audit_log)
    agent.classify(merchant="Albert", mcc_code="5411")
    events = audit_log.events_for_layer("categorization")
    assert len(events) >= 1
```

- [ ] **Step 4: Run tests, expect FAIL**

- [ ] **Step 5: Implement `CategorizationAgent` with Claude API call**

```python
import os
from dataclasses import dataclass
from anthropic import Anthropic

from agents.audit_logger import AuditLogger


@dataclass
class CategorizationResult:
    category: str
    confidence: float
    raw_llm_output: str


class CategorizationAgent:
    LAYER_NAME = "categorization"
    MODEL = "claude-opus-4-6"

    SYSTEM_PROMPT = f"""Jsi expertní klasifikátor bankovních transakcí pro českou banku.

Tvým úkolem je každou transakci zařadit do PŘESNĚ JEDNÉ z následujících kategorií:
{', '.join(CANONICAL_CATEGORIES)}

Pravidla:
- Vrať pouze jednu z těchto kategorií, nic jiného
- MCC kód je vodítko, ale ne autoritativní (např. "Lidl elektro" má MCC potravin, ale je to Elektronika)
- Při pochybnostech vol "Ostatní"
- Tvůj výstup JE jen jedno slovo: název kategorie
"""

    def __init__(self, audit: AuditLogger | None = None):
        self.audit = audit
        self.client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def classify(self, merchant: str, mcc_code: str) -> CategorizationResult:
        user_message = f"Obchodník: {merchant}\nMCC kód: {mcc_code}\n\nKategorie:"
        response = self.client.messages.create(
            model=self.MODEL,
            max_tokens=20,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = response.content[0].text.strip()

        # Constrain to canonical set
        category = raw if raw in CANONICAL_CATEGORIES else "Ostatní"
        confidence = 1.0 if raw in CANONICAL_CATEGORIES else 0.5

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="classify",
                metadata={"merchant": merchant, "mcc": mcc_code, "category": category},
            )

        return CategorizationResult(category=category, confidence=confidence, raw_llm_output=raw)
```

- [ ] **Step 6: Run accuracy test against the golden 50-sample set**

```bash
ANTHROPIC_API_KEY=$(cat ~/.anthropic_key) uv run pytest tests/test_categorization.py::test_categorization_accuracy_above_92_percent -v
```

Expected: PASS at >= 92%. If accuracy is below target, iterate on the system prompt (add few-shot examples for the failures) and re-run. Maximum 3 iterations — if still below, accept and document.

- [ ] **Step 7: Commit**

```bash
git add notix-poc/agents/categorization.py notix-poc/tests/test_categorization.py notix-poc/tests/golden/
git commit -m "feat(notix-poc): Layer 3 Categorization Agent (Czech, accuracy >= 92%)

LLM-based transaction classifier with 18 canonical Czech categories.
Constrained-output design — LLM raw output is filtered to canonical
set, anything outside falls to 'Ostatní'.

Golden test set: 50 hand-labeled samples spanning all categories.
Accuracy on golden set: <ACTUAL>%, target was 92%.

Audit hook: every classification emits an event.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Day 4 — Tuesday 2026-04-14 (Layers 4 + 5)

### Task 4.1: Layer 4 — Anomaly Agent (statistical + LLM hybrid)

**Files:**
- Create: `notix-poc/agents/anomaly.py`
- Test: `notix-poc/tests/test_anomaly.py`

**Anomaly types:**
1. **High-value outlier** — single transaction > 3x persona's typical max. Statistical: compute persona's 95th percentile from history.
2. **Card-not-present fraud** — high-value online transaction in unusual category. Heuristic: amount > 2000 CZK + card_present=False + category not in persona's recurring set.
3. **Velocity anomaly** — > N transactions in M hours. Statistical.

- [ ] **Step 1: Write failing tests for each anomaly type**

```python
def test_detects_high_value_outlier(persona_b_transactions):
    """Persona B has a planted high_value_anomaly scenario."""
    agent = AnomalyAgent()
    flags = agent.detect(persona_b_transactions)
    assert any(f.type == "high_value_outlier" for f in flags)
    high_value = next(f for f in flags if f.type == "high_value_outlier")
    assert high_value.severity in ("high", "critical")


def test_detects_card_not_present_fraud(persona_c_transactions):
    """Persona C has a planted fraud_card_not_present scenario."""
    agent = AnomalyAgent()
    flags = agent.detect(persona_c_transactions)
    assert any(f.type == "card_not_present_fraud" for f in flags)


def test_no_false_positives_on_persona_a():
    """Persona A's planted scenario is investment_recommendation, not an anomaly.
    Anomaly agent should NOT flag persona A's investment-adjacent transactions
    as fraud — that's a job for Layer 8 governance."""
    agent = AnomalyAgent()
    flags = agent.detect(persona_a_transactions)
    fraud_flags = [f for f in flags if "fraud" in f.type]
    assert len(fraud_flags) == 0
```

- [ ] **Step 2: Run, FAIL**

- [ ] **Step 3: Implement statistical anomaly detection**

```python
from dataclasses import dataclass
from decimal import Decimal
from statistics import quantiles


@dataclass
class AnomalyFlag:
    type: str  # high_value_outlier | card_not_present_fraud | velocity_anomaly
    severity: str  # low | medium | high | critical
    transaction_index: int
    reason_cz: str  # Czech explanation for the user-facing report


class AnomalyAgent:
    LAYER_NAME = "anomaly"

    def detect(self, transactions: list[dict]) -> list[AnomalyFlag]:
        flags: list[AnomalyFlag] = []
        flags.extend(self._detect_high_value_outliers(transactions))
        flags.extend(self._detect_card_not_present_fraud(transactions))
        flags.extend(self._detect_velocity(transactions))
        return flags

    def _detect_high_value_outliers(self, txs: list[dict]) -> list[AnomalyFlag]:
        amounts = [Decimal(str(t["amount_czk"])) for t in txs]
        if len(amounts) < 10:
            return []
        # 95th percentile threshold
        sorted_amts = sorted(amounts)
        p95 = sorted_amts[int(len(sorted_amts) * 0.95)]
        threshold = p95 * Decimal("3")

        flags = []
        for i, tx in enumerate(txs):
            if Decimal(str(tx["amount_czk"])) > threshold:
                flags.append(
                    AnomalyFlag(
                        type="high_value_outlier",
                        severity="high",
                        transaction_index=i,
                        reason_cz=f"Transakce ve výši {tx['amount_czk']} Kč je výrazně nad vaším obvyklým rozsahem.",
                    )
                )
        return flags

    def _detect_card_not_present_fraud(self, txs: list[dict]) -> list[AnomalyFlag]:
        flags = []
        for i, tx in enumerate(txs):
            if (
                not tx.get("card_present", True)
                and Decimal(str(tx["amount_czk"])) >= Decimal("2000")
            ):
                flags.append(
                    AnomalyFlag(
                        type="card_not_present_fraud",
                        severity="critical",
                        transaction_index=i,
                        reason_cz=f"Online transakce {tx['amount_czk']} Kč u {tx['merchant']} — možný podvod.",
                    )
                )
        return flags

    def _detect_velocity(self, txs: list[dict]) -> list[AnomalyFlag]:
        # Implement: > 10 transactions in any 1-hour window
        return []  # Stub for spike; full implementation in production POC
```

- [ ] **Step 4: Run, PASS**

- [ ] **Step 5: Commit**

```bash
git add notix-poc/agents/anomaly.py notix-poc/tests/test_anomaly.py
git commit -m "feat(notix-poc): Layer 4 Anomaly Agent (statistical, hybrid)

Detects high-value outliers (95th percentile × 3), card-not-present
fraud (online + > 2000 Kč), and velocity anomalies (stub for spike;
production POC fleshes this out). Each flag carries a Czech-language
reason string for the user-facing report.

Tests cover all 3 personas — fraud detected on persona-c, high-value
on persona-b, no false positives on persona-a.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 4.2: Layer 5 — Insight Agent (Czech narrative generator)

**Files:**
- Create: `notix-poc/agents/insight.py`
- Test: `notix-poc/tests/test_insight.py`

The Insight Agent takes categorized transactions + anomaly flags and produces a Czech-language personalized narrative report. Output is structured (Pydantic model) so the Report Composer (Layer 6) can render it; the actual prose is LLM-generated.

- [ ] **Step 1: Define the report structure**

```python
"""Layer 5 — Insight Agent.

Produces a personalized Czech-language financial briefing from
categorized transactions + anomaly flags. Output is a Pydantic model
that the Report Composer (Layer 6) renders into the final user-facing
shape.

LLM-backed: uses Claude API to generate the prose. Reasoning trace
is captured separately for AI Act Art. 13 (right to explanation).
"""

from pydantic import BaseModel, Field


class InsightReport(BaseModel):
    persona_id: str
    summary_cz: str = Field(description="2-3 sentence summary, Czech")
    spending_breakdown_cz: dict[str, str] = Field(
        description="Category → 1-sentence Czech narrative"
    )
    anomalies_cz: list[str] = Field(
        description="One bullet per anomaly, Czech, customer-friendly"
    )
    recommendations_cz: list[dict] = Field(
        description="2-3 recommendations. Each: {tier: 1|2, text_cz: str, requires_approval: bool}"
    )
    reasoning_trace: str = Field(
        description="Internal LLM reasoning, NOT shown to customer (AI Act Art. 13)"
    )
```

- [ ] **Step 2: Write contract test (structure, not exact text)**

```python
def test_insight_returns_well_formed_report():
    agent = InsightAgent()
    transactions = load_persona("persona-a")
    anomalies = []
    report = agent.generate(persona_id="persona-a", transactions=transactions, anomalies=anomalies)

    assert isinstance(report, InsightReport)
    assert report.persona_id == "persona-a"
    assert len(report.summary_cz) > 20
    assert len(report.recommendations_cz) >= 2
    # Customer-facing strings must be Czech (heuristic: contain a Czech diacritic)
    assert any(c in report.summary_cz for c in "áčďéěíňóřšťúůýž")


def test_tier_2_recommendations_marked_for_approval():
    """Investment-adjacent recommendations must be tier 2 and flagged."""
    agent = InsightAgent()
    transactions = load_persona("persona-a")  # has investment scenario
    report = agent.generate(persona_id="persona-a", transactions=transactions, anomalies=[])
    tier_2 = [r for r in report.recommendations_cz if r["tier"] == 2]
    assert len(tier_2) >= 1
    for rec in tier_2:
        assert rec["requires_approval"] is True


def test_insight_emits_audit_event(audit_log):
    agent = InsightAgent(audit=audit_log)
    agent.generate(persona_id="persona-a", transactions=load_persona("persona-a"), anomalies=[])
    events = audit_log.events_for_layer("insight")
    assert len(events) >= 1
```

- [ ] **Step 3: Run, FAIL**

- [ ] **Step 4: Implement `InsightAgent.generate(...)`**

Single Claude API call with a structured-output system prompt that requests JSON matching `InsightReport` schema. Validation via Pydantic on response.

```python
import json
import os
from anthropic import Anthropic

from agents.audit_logger import AuditLogger


class InsightAgent:
    LAYER_NAME = "insight"
    MODEL = "claude-opus-4-6"

    SYSTEM_PROMPT = """Jsi privátní bankéř pro klienty České spořitelny. Tvým úkolem je
napsat personalizovaný finanční přehled pro klienta na základě jeho transakcí.

Pravidla:
- Píšeš pouze česky, s plnou diakritikou
- Tón: vstřícný, pomáhající, NE prodejní
- Doporučení tier 1: drobné optimalizace (úspora na předplatném apod.) — automaticky
- Doporučení tier 2: investice, úvěr, pojistka — vyžaduje lidský souhlas (requires_approval: true)
- Vrať pouze JSON objekt přesně podle schématu, nic jiného

Schéma:
{
  "summary_cz": "...",
  "spending_breakdown_cz": {"Kategorie": "popis"},
  "anomalies_cz": ["..."],
  "recommendations_cz": [{"tier": 1|2, "text_cz": "...", "requires_approval": true|false}],
  "reasoning_trace": "..."
}
"""

    def __init__(self, audit: AuditLogger | None = None):
        self.audit = audit
        self.client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def generate(
        self, persona_id: str, transactions: list[dict], anomalies: list
    ) -> InsightReport:
        # Build user message with categorized transactions + anomaly summaries
        user_message = self._format_input(transactions, anomalies)

        response = self.client.messages.create(
            model=self.MODEL,
            max_tokens=2000,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_json = response.content[0].text.strip()

        # Strip markdown code fences if present
        if raw_json.startswith("```"):
            raw_json = raw_json.split("```")[1].lstrip("json").strip()

        data = json.loads(raw_json)
        data["persona_id"] = persona_id
        report = InsightReport(**data)

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="generate",
                persona_id=persona_id,
                metadata={"recommendations_count": len(report.recommendations_cz)},
            )

        return report

    def _format_input(self, transactions, anomalies) -> str:
        # Compact summary of transactions by category + anomaly bullets
        ...
```

- [ ] **Step 5: Run, PASS**

- [ ] **Step 6: Commit**

```bash
git add notix-poc/agents/insight.py notix-poc/tests/test_insight.py
git commit -m "feat(notix-poc): Layer 5 Insight Agent (Czech narrative, structured output)

LLM-backed personalized briefing generator. Output is a strict
Pydantic model for downstream consumption by Layer 6. Tier-2
recommendations (investment, credit) carry requires_approval=true
so the Layer 8 governance gate routes them to human review.

Reasoning trace captured separately for AI Act Art. 13 compliance.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Day 5 — Wednesday 2026-04-15 (Layer 6 + Audit Logger full + UI scaffold)

### Task 5.1: Layer 6 — Report Composer

**Files:**
- Create: `notix-poc/agents/report_composer.py`
- Test: `notix-poc/tests/test_report_composer.py`

The Report Composer takes the `InsightReport` model and renders it into the final shape consumed by the George app integration. Spike output: a Pydantic `GeorgeAppReport` model + a Czech-language Markdown rendering for the UI.

- [ ] **Step 1: Define output contract** — `GeorgeAppReport` Pydantic model with header, sections (summary, breakdown, anomalies, recommendations), and footer.
- [ ] **Step 2: Write test** — input is a known `InsightReport`, output must include all sections, all strings in Czech, no PII anywhere.
- [ ] **Step 3: Run, FAIL.**
- [ ] **Step 4: Implement** — pure formatter, no LLM. Markdown template + Pydantic transform.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: Commit:** `feat(notix-poc): Layer 6 Report Composer (George app contract + Czech Markdown)`

### Task 5.2: Layer 7 — Audit Logger full implementation

**Files:**
- Modify: `notix-poc/agents/audit_logger.py` (extend skeleton from Task 2.4)
- Test: `notix-poc/tests/test_audit_logger.py` (extend)

Day 2 shipped a skeleton AuditLogger. Day 5 fleshes it out:

- [ ] **Step 1: Add DORA-aligned schema fields** — `risk_classification`, `decision_rationale`, `data_subject_id`, `retention_until`.
- [ ] **Step 2: Add `query_by_persona(persona_id)` and `export_for_audit(format='csv')` methods.**
- [ ] **Step 3: Test the export path** — generate a CSV that satisfies a DORA Art. 11 sample audit query.
- [ ] **Step 4: Commit:** `feat(notix-poc): Layer 7 full DORA-aligned audit log (export, query, retention)`

### Task 5.3: Next.js UI scaffold

**Files:**
- Create: `notix-poc/ui/package.json`
- Create: `notix-poc/ui/next.config.mjs`
- Create: `notix-poc/ui/app/layout.tsx`
- Create: `notix-poc/ui/app/page.tsx` (report viewer)
- Create: `notix-poc/ui/app/globals.css`

- [ ] **Step 1: `npx create-next-app@latest ui --typescript --app --no-tailwind --use-npm`** from `notix-poc/`
- [ ] **Step 2: Replace boilerplate `app/page.tsx` with a report viewer that fetches `GET http://localhost:8000/api/poc/report/persona-a` and renders the Czech Markdown report.**
- [ ] **Step 3: Add minimal CSS for readability** — dark gradient background, Czech-friendly font (Inter/Outfit), no design system yet.
- [ ] **Step 4: Run dev server:** `cd ui && npm run dev`. Verify report renders in browser.
- [ ] **Step 5: Commit:** `feat(notix-poc): Next.js UI scaffold + report viewer page`

---

## Day 6 — Thursday 2026-04-16 (Layer 8 — Governance + e2e test)

This is the **most important day** in the spike. Layer 8 is the differentiator. By end of day, the full pipeline must run end-to-end for all 3 personas, with each persona triggering exactly one governance event that the human approval UI exercises.

### Task 6.1: Layer 8 — Governance gate (rules engine)

**Files:**
- Create: `notix-poc/agents/governance.py`
- Modify: `notix-poc/policies/default.yaml` (write the actual rules)
- Test: `notix-poc/tests/test_governance.py`

- [ ] **Step 1: Write the YAML policy.**

```yaml
version: 1
rules:
  - id: investment_recommendation_requires_approval
    matches:
      decision_type: recommendation
      tier: 2
      keywords_cz: ["investice", "akcie", "podílový fond", "ETF", "burza"]
    classification: escalate
    rationale_cz: "Investiční doporučení vyžaduje schválení podle MiFID II Art. 25."
    compliance_refs: ["MiFID II Art. 25", "AI Act Art. 14"]

  - id: critical_fraud_flag_blocks_auto_send
    matches:
      anomaly_severity: critical
      anomaly_type: card_not_present_fraud
    classification: escalate
    rationale_cz: "Kritická podvodná transakce — vyžaduje lidskou kontrolu před odesláním zákazníkovi."
    compliance_refs: ["AI Act Art. 14"]

  - id: high_value_anomaly_escalates
    matches:
      anomaly_severity: high
      anomaly_type: high_value_outlier
    classification: escalate
    rationale_cz: "Vysoce neobvyklá transakce — informujte zákazníka jen po lidské kontrole."
    compliance_refs: ["AI Act Art. 14"]

  - id: default_auto_execute
    matches: {}
    classification: auto
    rationale_cz: "Standardní doporučení tier 1 — bez rizika, automaticky."
```

- [ ] **Step 2: Write failing tests for each rule.**

```python
def test_investment_recommendation_escalates(audit_log):
    gate = GovernanceGate(policy_path="policies/default.yaml", audit=audit_log)
    decision = {
        "decision_type": "recommendation",
        "tier": 2,
        "text_cz": "Doporučujeme zvážit investici do indexového fondu.",
    }
    result = gate.evaluate(decision)
    assert result.classification == "escalate"
    assert "MiFID II" in result.rationale_cz


def test_critical_fraud_escalates(audit_log):
    gate = GovernanceGate(policy_path="policies/default.yaml", audit=audit_log)
    decision = {
        "decision_type": "anomaly_alert",
        "anomaly_severity": "critical",
        "anomaly_type": "card_not_present_fraud",
    }
    result = gate.evaluate(decision)
    assert result.classification == "escalate"


def test_default_auto_executes(audit_log):
    gate = GovernanceGate(policy_path="policies/default.yaml", audit=audit_log)
    decision = {"decision_type": "recommendation", "tier": 1}
    result = gate.evaluate(decision)
    assert result.classification == "auto"


def test_every_evaluation_writes_audit_event(audit_log):
    gate = GovernanceGate(policy_path="policies/default.yaml", audit=audit_log)
    gate.evaluate({"decision_type": "recommendation", "tier": 1})
    events = audit_log.events_for_layer("governance")
    assert len(events) == 1
    assert "rule_id" in events[0].metadata
```

- [ ] **Step 3: Run, FAIL.**

- [ ] **Step 4: Implement `GovernanceGate`.**

```python
import yaml
from dataclasses import dataclass
from agents.audit_logger import AuditLogger


@dataclass
class GovernanceDecision:
    classification: str  # auto | escalate | block
    rule_id: str
    rationale_cz: str
    compliance_refs: list[str]


class GovernanceGate:
    LAYER_NAME = "governance"

    def __init__(self, policy_path: str, audit: AuditLogger | None = None):
        with open(policy_path) as f:
            self.policy = yaml.safe_load(f)
        self.audit = audit

    def evaluate(self, decision: dict) -> GovernanceDecision:
        for rule in self.policy["rules"]:
            if self._matches(rule["matches"], decision):
                result = GovernanceDecision(
                    classification=rule["classification"],
                    rule_id=rule["id"],
                    rationale_cz=rule["rationale_cz"],
                    compliance_refs=rule.get("compliance_refs", []),
                )
                if self.audit:
                    self.audit.log_event(
                        layer=self.LAYER_NAME,
                        action="evaluate",
                        metadata={
                            "rule_id": rule["id"],
                            "classification": rule["classification"],
                        },
                    )
                return result
        raise ValueError("No rule matched and no default — policy is incomplete.")

    def _matches(self, matchers: dict, decision: dict) -> bool:
        if not matchers:
            return True  # default rule
        for key, expected in matchers.items():
            if key == "keywords_cz":
                text = decision.get("text_cz", "").lower()
                if not any(kw.lower() in text for kw in expected):
                    return False
            else:
                if decision.get(key) != expected:
                    return False
        return True
```

- [ ] **Step 5: Run, PASS.**

- [ ] **Step 6: Commit:** `feat(notix-poc): Layer 8 Governance gate (YAML rules, MiFID II + AI Act)`

### Task 6.2: Approval UI (Next.js page)

**Files:**
- Create: `notix-poc/ui/app/governance/page.tsx`
- Create: `notix-poc/api/routes/governance.py` (FastAPI route)

The approval queue page lists all pending escalations. Each row shows the persona, decision type, the rationale, and Approve/Reject buttons. Clicking Approve writes an audit event and resumes the pipeline.

- [ ] **Step 1: Add `GET /api/poc/governance/queue` and `POST /api/poc/governance/{id}/approve` routes** to FastAPI.
- [ ] **Step 2: Wire the queue endpoint** to read pending escalations from the audit log (events with `classification: escalate` and no follow-up `approval` event).
- [ ] **Step 3: Build `app/governance/page.tsx`** with a list view, fetch from the queue endpoint, Approve/Reject buttons that POST to the approval endpoint.
- [ ] **Step 4: Manual test:** spin up `uvicorn` + `npm run dev`, run the e2e script for persona-c, refresh the governance page, see the fraud escalation, click Approve, see it disappear.
- [ ] **Step 5: Commit:** `feat(notix-poc): Approval UI for governance queue (Next.js + FastAPI route)`

### Task 6.3: End-to-end test (3 personas)

**Files:**
- Create: `notix-poc/scripts/run_e2e.py`
- Create: `notix-poc/tests/test_e2e.py`

- [ ] **Step 1: Write `scripts/run_e2e.py`** — orchestrator that calls Layer 1 → 2 → 3 → 4 → 5 → 8 → 6 → 7 for one persona, prints progress, dumps the final report to stdout.
- [ ] **Step 2: Write `tests/test_e2e.py`** — runs the orchestrator for all 3 personas, asserts:
  - Each persona produces a non-empty Czech report.
  - PII leakage = 0 across all 3.
  - Persona A triggers exactly 1 investment escalation.
  - Persona B triggers exactly 1 high-value escalation.
  - Persona C triggers exactly 1 fraud escalation.
  - Total audit events >= 25 across all layers.
- [ ] **Step 3: Run, expect PASS** (with all preceding tasks complete).
- [ ] **Step 4: Commit:** `test(notix-poc): end-to-end test for all 3 personas + governance flow`

---

## Day 7 — Friday 2026-04-17 (IP carve-out + spike polish)

### Task 7.1: IP carve-out clause draft (Czech + English)

**Files:**
- Create: `notix-poc/docs/ip-carve-out-draft.md`

This is the **most legally important** deliverable of the 10 days. It must be reviewed by a Czech IP / employment lawyer before the meeting. Steve identifies the lawyer; Claude drafts the text.

- [ ] **Step 1: Steve identifies a Czech IP/employment lawyer** — by Friday morning. Send the draft over the weekend or first thing Monday.
- [ ] **Step 2: Draft in Czech (primary language for the contract).** Structure:

```markdown
## Příloha č. 1 ke smlouvě o pracovním poměru — Vyloučení existujících děl zaměstnance

### 1. Předmět přílohy
Tato příloha definuje rozsah existujících autorských děl, vynálezů, ochranných známek
a souvisejících práv duševního vlastnictví, která zaměstnanec [JMÉNO] vytvořil před
nástupem do pracovního poměru u zaměstnavatele [NOTIX a.s., IČO XXX] a která
zůstávají výhradně v jeho vlastnictví (dále jen "Vyhrazená díla").

### 2. Seznam Vyhrazených děl
Strany se výslovně dohodly, že následující projekty, jejich kód, doménová jména,
obchodní názvy, ochranné známky, marketingové materiály, databáze klientů, příjmy
z těchto projektů, a jakékoliv jejich budoucí iterace, jsou Vyhrazenými díly
zaměstnance:

1. **DataPalo** — B2B AI nástroj pro analýzu dat, dostupný na doméně datapalo.app,
   včetně všech repozitářů kódu, infrastruktury, klientů, příjmů a souvisejícího
   know-how.

2. **AI Code Support** — B2C AI tutor pro začátečníky v programování, dostupný
   na doméně aicode.support, včetně všech materiálů, klientů, příjmů a know-how.

3. **PromptPro** — produktivní nástroj distribuovaný přes Google Workspace
   Marketplace s 226 000+ instalací, včetně všech budoucích verzí.

4. **AgentForge.Tech** — zastřešující obchodní značka, doménové jméno
   agentforge.tech, marketing materiály, a portfolio produktů pod ní.

5. **Forge Creative** — konzultační praxe zaměstnance, včetně všech
   klientských smluv, fakturace, know-how, a profesní reputace.

### 3. Pravidla souběžné činnosti
Strany se dohodly, že:

3.1 Zaměstnanec je oprávněn pokračovat ve vývoji, údržbě, marketingu a komercializaci
Vyhrazených děl mimo svou pracovní dobu u zaměstnavatele.

3.2 Pracovní doba zaměstnance je definována jako [DEFINICE] a aktivity mimo tuto
dobu jsou výhradně na uvážení zaměstnance.

3.3 Vyhrazená díla nepodléhají povinnosti převést jakákoliv autorská nebo majetková
práva na zaměstnavatele, a to ani podle § 58 zákoníku práce, ani podle § 12
autorského zákona.

### 4. Vztah k pracovní činnosti zaměstnance
4.1 Pokud by v rámci pracovního poměru vznikly nové verze, deriváty nebo součásti
Vyhrazených děl, zůstávají i tyto výhradně ve vlastnictví zaměstnance, pokud nejsou
písemně označeny jako díla vytvořená pro zaměstnavatele.

4.2 Vyhrazená díla nesmí být jakkoliv smíšena s kódem, daty nebo procesy
zaměstnavatele bez výslovného písemného souhlasu obou stran.

### 5. Ne-konkurenční doložka
5.1 Ne-konkurenční doložka v hlavní smlouvě se výslovně NEVZTAHUJE na Vyhrazená
díla uvedená v této příloze.

5.2 Ne-konkurenční doložka je omezena na přímou konkurenci zaměstnavatele,
nikoliv na obecnou činnost v oblasti umělé inteligence, datové analýzy nebo
souvisejících technologií.

### 6. Účinnost
Tato příloha tvoří nedílnou součást pracovní smlouvy a je účinná dnem
podpisu obou stran. Změny této přílohy vyžadují písemný souhlas obou stran.

[Podpisy, datum, místo]
```

- [ ] **Step 3: Translate to English** for international counsel review and Steve's own clarity. Same structure.
- [ ] **Step 4: Save both versions to `notix-poc/docs/ip-carve-out-draft.md`.**
- [ ] **Step 5: Commit:** `docs(notix-poc): IP carve-out clause draft (CZ + EN, pending lawyer review)`
- [ ] **Step 6: Steve sends to lawyer** — flag this as a separate action, not a Claude code task.

### Task 7.2: Spike polish

- [ ] **Step 1: Run all tests, fix any failures.**
- [ ] **Step 2: Run linter:** `uv run ruff check notix-poc/`. Fix issues.
- [ ] **Step 3: Walk through `scripts/run_e2e.py persona-a`, persona-b, persona-c manually, watch for visual rough edges.**
- [ ] **Step 4: Smooth README run instructions** — make sure a brand-new clone could `git clone → cd notix-poc → uv sync → cp .env.example .env → run` without surprises.
- [ ] **Step 5: Commit polish fixes individually as found.**

---

## Day 8 — Saturday 2026-04-18 (Metrics + screencast + deck v3)

### Task 8.1: Metrics dashboard

**Files:**
- Create: `notix-poc/scripts/metrics_report.py`
- Create: `notix-poc/ui/app/metrics/page.tsx` (optional)

- [ ] **Step 1: Write `scripts/metrics_report.py`** — runs the e2e pipeline for all 3 personas, measures latency per layer, categorization accuracy on golden set, PII leakage count, hallucination rate (against golden insight samples). Outputs a Markdown report to stdout and to `metrics-2026-04-18.md`.
- [ ] **Step 2: Run it:** `uv run python scripts/metrics_report.py`
- [ ] **Step 3: Verify all 5 spike metrics from spec §7.1 are met:**
  - Latency < 3 s ✓
  - Categorization accuracy > 92% ✓
  - PII leakage = 0 ✓
  - Hallucination < 2% ✓
  - 100% governance escalation coverage ✓
- [ ] **Step 4: If any metric is missing, fix that specific layer.**
- [ ] **Step 5: Commit:** `feat(notix-poc): metrics dashboard + signed-off spike report`

### Task 8.2: Screencast recording

This is the **insurance policy** for the meeting. If the laptop demo fails, Steve plays the screencast.

- [ ] **Step 1: Plan the script (Czech narration)** — 90 seconds:
  1. (5s) "Tohle je Banking Customer Insight Agent — POC pro Českou spořitelnu, postavený za víkend jako důkaz, že tohle umím dodat."
  2. (15s) Show synthetic data + persona switcher.
  3. (20s) Run the pipeline live, narrating each layer as it ticks past in the terminal output.
  4. (20s) Open the UI, show the generated Czech report for persona C.
  5. (20s) Show the governance approval queue with the fraud escalation, click Approve, show it resolve.
  6. (10s) "8 vrstev. Compliance v každé z nich. Žádné PowerPointy, žádné mockupy. Tohle je den 7 spike — POC v plné délce je 4-6 týdnů."

- [ ] **Step 2: Record with QuickTime / OBS / Screen Studio** — 1080p, 30fps, with Steve's voice narration in Czech.
- [ ] **Step 3: Save as `screencasts/notix-poc-demo-cz-90s.mp4`.** (Excluded from git via .gitignore.)
- [ ] **Step 4: Verify playback** on Steve's laptop and a backup device.
- [ ] **Step 5: Steve uploads to a private Google Drive folder** as a third backup (in case both laptops fail).

### Task 8.3: Pitch deck v3

**Files (outside the repo — Steve's existing deck):**
- Modify: `notix_pitch_cs.pdf` source (Keynote / Google Slides / Pitch / wherever Steve has it)

The v2 deck already exists from Perplexity. v3 adds 3 slides:

1. **POC architecture slide** — the 8-layer table from spec §3.2 + the data flow diagram.
2. **Compliance slide** — the table from spec §6, with explicit AI Act / GDPR / DORA / MiFID II citations.
3. **ROI slide** — back-of-envelope numbers (retention uplift, fraud prevention value, CSAT impact). Mark these as "benchmark targets, not measured outcomes" — honesty matters, especially with Petr Hnízdil.

Plus: verify the 3 open factual claims from the v2 deck (Managed Agents API beta, ES statistics, Framework v2.1) — these are flagged in `project_notix_meeting.md` as Monday TODOs but should be confirmed before deck final.

- [ ] **Step 1: Steve owns this** — Claude provides slide content as Markdown / images, Steve assembles in his deck tool.
- [ ] **Step 2: Claude generates the 8-layer architecture diagram** as a PNG (Mermaid → render).
- [ ] **Step 3: Claude generates the compliance table as a clean PNG / Markdown for Steve to paste.**
- [ ] **Step 4: ROI slide:** draft 3-4 numbers with sources, Steve picks which to use.
- [ ] **Step 5: Steve exports v3 deck to PDF** for printed material.

---

## Day 9 — Sunday 2026-04-19 (Dry run rehearsal)

### Task 9.1: Full meeting rehearsal

This day is **mostly Steve's**, with Claude as a simulator. No new code.

- [ ] **Step 1: Set up the rehearsal environment** — Steve at the table, laptop open, deck loaded, water glass nearby. Claude acts as Jiří (CEO) and Petr (AI lead) alternately.
- [ ] **Step 2: Walk through the meeting structure** from `project_notix_meeting.md`:
  - 0-2 min: Two paths opening
  - 2-4 min: Hook Verze C
  - 4-8 min: PromptPro / DataPalo / Voice AI portfolio
  - 8-20 min: POC návrh — open laptop, show the spike running, narrate the 8 layers
  - 20-23 min: Compliance vrstva slide
  - 23-25 min: Close — "4-6 týdnů POC, pak se bavíme o formě spolupráce"
  - 25-60 min: Dialog (Q&A rounds 1-3)

- [ ] **Step 3: Run all 3 Q&A rounds** with Claude as the questioner:
  - **Round 1 — Technical:** "How does Claude Agent SDK handle multi-agent state? What's the difference between MCP and your governance layer? How do you handle PII in the LLM call boundary?"
  - **Round 2 — Business / employment:** "What's your salary expectation? Are you committed full-time? Do you have other projects?" — Steve practices the **HPP red lines conversation** here. Claude probes hard.
  - **Round 3 — Portfolio:** "Tell us about PromptPro. How is DataPalo monetized? Why isn't Voice AI in production?"

- [ ] **Step 4: Practice the IP carve-out conversation explicitly.** Claude as Jiří: "Standardní smlouva má IP klauzuli, která zahrnuje všechny vaše projekty. Nemůžeme udělat výjimku." Steve practices the response: "Rozumím standardu, ale moje pět projektů jsou existující díla z doby před nástupem. Jsem ochoten je chránit přílohou nebo přejít na B2B kontrakt — pojďme o tom mluvit."
- [ ] **Step 5: Practice the "spike is not POC" framing** — Claude as Petr: "Vy už jste to postavil! Proč bychom platili za POC, když to máme?" Steve practices: "Tohle je víkendový spike, proof of capability. Skutečný POC s production compliance, AWS Bedrock Frankfurt staging, full DORA artifacts, integration s vaším Java backend stubem — to je těch 4-6 týdnů, které vám navrhuju."
- [ ] **Step 6: Identify weak moments** — pauzuj rehearsal hned, jak Steve zaškobrtne. Vyřešit, projet znovu.
- [ ] **Step 7: After rehearsal: nothing. No coding, no further changes. Steve goes to bed early.**

---

## Day 10 — Monday 2026-04-20 (Buffer + printed materials)

**This day is sacred. No new code. No new features. No "just one more thing".**

### Task 10.1: Final retouche + printed materials

- [ ] **Step 1: Final commit pass** — review `git log --oneline` for the 10-day branch, make sure every commit is clean. No stray WIP.
- [ ] **Step 2: Print materials:**
  - Pitch deck v3 (PDF, color, A4, 1 copy for Steve, 3 backup copies in case Jiří/Petr/Peter want to take one)
  - POC spec doc (the Czech translated 2-3 page version, 4 copies)
  - IP carve-out clause draft (Czech version, lawyer-reviewed if possible by now, 2 copies)
- [ ] **Step 3: Pack the meeting bag:**
  - Laptop + charger
  - HDMI / USB-C adapter (NOTIX projector compatibility unknown)
  - Backup USB stick with screencast + deck PDF
  - Printed materials (above)
  - Business cards / contact sheet
  - Bottle of water
  - Pen + small notebook
- [ ] **Step 4: Pre-meeting checklist sanity check:**
  - Internet at NOTIX office? Bring mobile hotspot as backup.
  - Power outlet? Bring extension cord + 2-prong adapter.
  - Screencast playable offline? Verify.
  - All API keys in `.env` valid? Test the e2e run one last time.
- [ ] **Step 5: Steve goes to bed before 22:00.** Final meal early, no alcohol, sleep in workout clothes if it helps with morning energy.

---

## Meeting day — Tuesday 2026-04-21 10:00

**Steve's day. Claude is on standby for emergency support only (e.g., last-minute deck fix, API key issue).**

### Task M.1: Pre-meeting (08:00 - 09:30)

- [ ] **Step 1: Light breakfast, coffee, walk.**
- [ ] **Step 2: Review pitch flow once** — Two paths → Hook → portfolio → POC demo → compliance → close.
- [ ] **Step 3: Review IP red lines once.** Memorize the 5 project names.
- [ ] **Step 4: Pack laptop + materials, leave for Pacovská 1, Praha 4 with 30+ minute buffer for Prague traffic.**

### Task M.2: At NOTIX office (09:45 - 11:00)

- [ ] **Step 1: Arrive 15 minutes early.** Sit in lobby, do not open laptop, be present.
- [ ] **Step 2: Greet Jiří, Petr, Peter. Czech, warm, eye contact.**
- [ ] **Step 3: Deliver the meeting per the rehearsed structure.**
- [ ] **Step 4: When you reach the POC slide, OPEN THE LAPTOP and run the spike live. Narrate.**
- [ ] **Step 5: Frame the spike correctly:** "Tohle je víkendový spike, proof of capability. Skutečný POC je 4-6 týdnů."
- [ ] **Step 6: In the close, plant the seed (one sentence) about ČS being the start of something bigger** — but **NOT NotixOS**. Refer to spec §1.3 + memory `project_notix_meeting.md` Phase 1.
- [ ] **Step 7: In Q&A rounds, hold the IP carve-out red line. If pushed: "Jsem ochoten o tom mluvit, ale je to neustupitelná podmínka HPP. Pokud to není možné, raději přejdeme na B2B kontrakt."**
- [ ] **Step 8: Listen more than you speak in Q&A.** Take notes by hand.
- [ ] **Step 9: At end of meeting, propose concrete next step:** "Mám pro vás konkrétní návrh. Místo abychom se bavili abstraktně o tom, co bych u vás mohl dělat, pojďme za 4-6 týdnů postavit jeden konkrétní use case..." (verbatim from spec §3.1).

### Task M.3: Post-meeting (11:00 - 12:00)

- [ ] **Step 1: Outside the building, write down everything you remember while it's fresh.**
- [ ] **Step 2: Send a same-day thank-you email** to all 3 attendees in Czech, with the printed POC spec attached as PDF and a one-paragraph recap of next steps.
- [ ] **Step 3: Update `project_notix_meeting.md` in memory with meeting outcome.**
- [ ] **Step 4: Take the rest of the day off. You've earned it.**

---

## Self-review

**Spec coverage:**
- Spec §1 (Context, primary goal) → covered by Day 1-10 plan, IP red lines explicit in Task 7.1 + M.2 Step 7
- Spec §2 (Problem statement) → covered by 8-layer architecture
- Spec §3 (Solution / 8 layers / data flow) → covered by Tasks 2.1-6.3 (one task per layer + e2e)
- Spec §4 (Scope) → in-scope items mapped to Tasks; out-of-scope items honored (no DataPalo code reuse, no NotixOS in meeting)
- Spec §5 (Personas) → defined in Task 2.1, exercised in Task 6.3 e2e test
- Spec §6 (Compliance framing) → mapped per layer in tests (PII leakage = 0, governance escalation tests cite Articles), full table in deck v3 (Task 8.3)
- Spec §7 (Success metrics) → measured in Task 8.1 metrics dashboard
- Spec §8 (Constraints) → respected (Czech-only report locked in Task 5.1, code at notix-poc/, Steve solo)
- Spec §9 (Open questions) → 3 remaining (NOTIX staging infra, IP lawyer review, brand decision) — handled in Task 7.1 + meeting
- Spec §10 (Deliverables) → 1=spec doc, 2=Steve translates, 3=Task 8.2 screencast, 4=Task 8.1 metrics, 5=Task 8.3 deck v3, 6=Task 7.1 IP draft, 7=Task 9.1 rehearsal notes
- Spec §11 (Risks) → mitigation strategies referenced in Day 6 (fallback to 6 layers), Day 9 (rehearsal), Day 10 (buffer day discipline)
- Spec §12 (Phases) → matches calendar overview at top of plan
- Spec §13 (Decision log) → all decisions reflected in plan

**Placeholder scan:** No "TBD" / "TODO" / "implement later" in code-bearing tasks. Day 7-10 tasks use checklists rather than code blocks (correct — they're not code work). Day 8.3 deck slide content described as "Steve assembles in his deck tool" (correct delegation; not a placeholder).

**Type consistency:** `Transaction` dataclass (Task 2.1) → `IngestionAgent.fetch()` returns list of dicts representing Transactions. `RedactionResult` (Task 2.3) → `redact_with_counts()` returns it; `redact_text()` returns just `.text`. `InsightReport` (Task 4.2) → consumed by Layer 6 in Task 5.1. `GovernanceDecision` (Task 6.1) → standalone dataclass, not consumed elsewhere in the plan (consumed by orchestrator in Task 6.3 e2e). Names consistent.

**Scope check:** Plan covers exactly the 10-day spike + meeting prep + meeting day. Does not creep into post-meeting POC (4-6 weeks) — that work has its own future plan if NOTIX approves.

---

## Execution handoff

Plan complete and saved to [`docs/superpowers/plans/2026-04-11-notix-poc-banking-agent.md`](./2026-04-11-notix-poc-banking-agent.md).

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for tasks like 2.1-6.3 (the code build days) where each task is self-contained and benefits from a clean context.

2. **Inline Execution** — I execute tasks in this session using `executing-plans` skill, batch execution with checkpoints. Best for tasks where Steve and I need tight collaboration (Day 7 IP draft, Day 8 deck content, Day 9 rehearsal).

**Recommendation:** **Hybrid.** Days 2-6 (code) → subagent-driven, fast iteration with reviews. Days 7-10 (collaborative work, prep, rehearsal) → inline. Day 1 evening (Task 0.1 bootstrap) → inline now, in this session, before bed.

Steve, which approach do you want?
