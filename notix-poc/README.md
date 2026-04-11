# NOTIX POC — Banking Customer Insight Agent

10-day spike for the NOTIX meeting on 2026-04-21. See [`../docs/superpowers/specs/2026-04-11-notix-poc-design.md`](../docs/superpowers/specs/2026-04-11-notix-poc-design.md) for the full design spec, and [`../docs/superpowers/plans/2026-04-11-notix-poc-banking-agent.md`](../docs/superpowers/plans/2026-04-11-notix-poc-banking-agent.md) for the implementation plan.

## What this is

An 8-layer agent that takes a synthetic Česká spořitelna customer transaction stream and produces a personalized Czech-language financial briefing. Every decision passes through a Human-above-the-Loop governance gate (Auto-Execute / Escalate / Block) and is written to an append-only audit log for AI Act / DORA compliance.

This is a **technical spike**, not a finished POC. It demonstrates capability and velocity. The 4-6 week paid POC builds a production-grade implementation on AWS Bedrock Frankfurt.

## Run locally

```bash
# 1. Install Python deps (uv, recommended)
uv sync

# 2. Set env vars
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY

# 3. Generate synthetic data
uv run python -m data.transaction_generator

# 4. Start API
uv run uvicorn api.main:app --reload --port 8000

# 5. (Optional) Start UI in another terminal
cd ui && npm install && npm run dev
```

## Architecture

8 layers:

1. **Ingestion Agent** — synthetic ČS API stub (Layer 1)
2. **PII Redaction Layer** — strips PII before LLM (Layer 2)
3. **Categorization Agent** — LLM transaction classifier, Czech (Layer 3)
4. **Anomaly Agent** — fraud + unusual spend detection (Layer 4)
5. **Insight Agent** — Czech narrative generator (Layer 5)
6. **Report Composer** — formats output for George app contract (Layer 6)
7. **Audit Logger** — append-only SQLite log (Layer 7, cross-cutting)
8. **Governance Gate** — Auto / Escalate / Block rules engine (Layer 8)

See spec doc §3 for the data flow diagram.

## Compliance framing

| Layer | Compliance article |
|---|---|
| 2 (PII Redaction) | GDPR Art. 5(1)(c) data minimization |
| 7 (Audit Logger) | AI Act Art. 12, DORA Art. 11 |
| 8 (Governance) | AI Act Art. 14 human oversight, MiFID II Art. 25 |

See spec doc §6 for the full compliance map.

## Demo (target end-state for 2026-04-21 meeting)

```
$ docker-compose up -d
$ uv run python scripts/run_e2e.py persona-c
[1/8] Ingestion: 90 days, 247 transactions
[2/8] PII Redaction: 0 leaks across 247 records
[3/8] Categorization: 247/247 classified (avg 0.18s)
[4/8] Anomaly: 3 flags (1 critical: card-not-present 8 900 Kč)
[5/8] Insight: report draft ready
[6/8] Governance: 1 escalation (fraud flag → human approval)
[7/8] Audit: 14 events logged
[8/8] Report Composer: persona-c-report.md ready

→ Open http://localhost:3000 to view the report and governance queue.
```

## Status

Day 1 (2026-04-11) — project bootstrap. Layers land in Days 2-6 per the implementation plan.
