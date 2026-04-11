# NOTIX POC Design — Banking Customer Insight Agent with Embedded AI Governance

**Authors:** Michael "Steve" Dedecek (founder) + Claude Opus 4.6 ("Jony", CSO)
**Date:** 2026-04-11 (Saturday evening)
**Status:** DRAFT — pending Steve's approval before tech spike begins
**Meeting target:** NOTIX a.s., 2026-04-21 10:00 CET, Pacovská 1, Praha 4
**Worktree:** `feat/notix-poc-banking-agent`

---

## Guiding principle

> Stavíme první kámen, ne OS. Další kámen, až když první funguje. AgentForgeOS se napíše retroaktivně z kamenů, ne dopředu z manifesta.

This document specifies the **first kámen** (stone). Nothing beyond it is designed here.

---

## Terminology note

The term **AgentForgeOS** is used throughout this document as a working name for the long-term vision of an EU enterprise AI operating system. A final brand decision (AgentForgeOS / NotixOS / co-branded) is **deferred to month 4-6 of a NOTIX HPP engagement** and will be the subject of a separate strategic conversation.

The word **"NotixOS" is explicitly not to be spoken** in the 2026-04-21 meeting, per `CLAUDE.md` and `project_notix_meeting.md` discipline. The vision must be planted as a seed in the close (one sentence), not pitched as product. This document is internal preparation, not an external handout.

---

## 1. Context

### 1.1 The opportunity

NOTIX a.s. (Czech enterprise IT firm, clients include ČS, ČSOB, KB, Škoda, Tesco, O2) has an open project: **real-time AI agents in a production banking environment for Česká spořitelna**. Peter Herco reached out to Steve on 2026-03-27 via LinkedIn after seeing his OtW status. CEO Jiří Šlefr and AI lead Petr Hnízdil specifically asked to meet him.

NOTIX has no visible AI offering today — Java/Spring Boot, Angular, Python, Kubernetes, Elastic/BigData. They need someone who can bridge strategic AI advisory and hands-on AI implementation. Steve's profile (30yr C-suite + shipped AI products at scale — PromptPro 226K installs, DataPalo, AI Code Support, Voice AI) is exactly that bridge.

### 1.2 Primary business goal

**Secure paid, stable engagement with NOTIX** — ideally as **HPP (hlavní pracovní poměr, 200 000 CZK gross/month)**, with an **IP carve-out red line** protecting DataPalo, AI Code Support, PromptPro, AgentForge.Tech, and Forge Creative as existing personal works of the employee.

Entry gate: a **4-6 week paid POC** delivered by Steve, with HPP conversation happening at the mid-point (week 2-3) of the POC.

**This is a cash-flow priority decision.** All strategic elegance is subordinate to the goal of Steve having a signed engagement with NOTIX leaving the 2026-04-21 meeting room, or at minimum an unambiguous path to one.

### 1.3 Secondary (deferred) goal

This POC is the first stone of a longer-term vision: an EU enterprise AI operating system. That vision remains **unspoken** in the first meeting by design. It re-enters the conversation only after the POC is delivered and Steve has earned insider credibility (month 4-6 of HPP).

### 1.4 Scope of this document

This document specifies:
- What Steve and Claude build in the **10 days** preceding the meeting (tech spike + supporting artifacts).
- What the **4-6 week POC** commitment will deliver if NOTIX approves.
- The compliance framing, metrics, and deliverables that justify a 200k/month employment offer.

---

## 2. Problem statement

Enterprise banks face a structural tension when deploying AI agents on customer-facing or risk-sensitive workflows:

- **Customer expectation:** personalized, real-time, actionable insights from banking data — not generic dashboards, not cross-sell spam.
- **Regulatory reality:** AI Act Article 14 (human oversight for high-risk AI) and Article 12 (automatic record keeping), GDPR (data minimization, PII protection), DORA (ICT operational resilience, audit trail), ČNB/EBA supervisory expectations, and MiFID II suitability testing for any investment-adjacent recommendation.
- **Operational reality:** banks cannot expose raw PII to foreign-hosted LLMs, cannot operate AI without auditability, and cannot ship agents that make tier-2 customer decisions without a human above the loop.

Every major European bank has some version of this problem. ČS is a concrete near-term instance. The POC addresses ČS specifically, but the architecture generalizes.

---

## 3. Proposed solution

A banking agent system that takes a ČS customer's transaction stream and produces a **personalized, time-aware financial briefing** — delivered as the customer opens the George app. Every decision the system makes passes through a **governance layer** (Auto-Execute / Escalate / Block) and is written to an append-only audit log.

### 3.1 Scenario (pitch narrative — Steve's voice, Czech)

> „Zákazník ČS otevře George. Místo generického dashboardu uvidí personalizovaný finanční briefing vygenerovaný za 3 sekundy: co utrácel minulý týden, co je nezvyklé, jaké úspory objevil AI asistent, co bude potřeba zaplatit příštích 7 dní, a 2-3 konkrétní doporučení šitá na míru. Žádné generické bannery. Žádné cross-sell spamy. Reálná, chytrá asistence jako od privátního bankéře — pro každého klienta."

### 3.2 Architecture — 8 layers (1 slide in the pitch deck)

| # | Layer | What it does | Enterprise why |
|---|---|---|---|
| 1 | **Ingestion Agent** | Calls ČS core banking API (synthetic stub in POC), fetches transactions for authenticated user | Works with existing ČS infra; NOTIX owns the real integration |
| 2 | **PII Redaction Layer** | Strips names, account numbers, IBAN, birth numbers (RČ) **before** any data leaves the system to an LLM | GDPR Art. 5 data minimization + ČNB/EBA ready by construction |
| 3 | **Categorization Agent** | Intelligent transaction categorization (not just MCC codes) | LLM distinguishes "Lidl potraviny" vs "Lidl elektro"; MCC codes alone cannot |
| 4 | **Anomaly Agent** | Detects fraud patterns + unusual spending | Immediate tangible value for ČS retention + fraud prevention story |
| 5 | **Insight Agent** | Personalized narrative + tier-1 recommendations | Heart of the product — this is what the customer sees |
| 6 | **Report Composer** | Formats output for the George app UI contract | NOTIX owns frontend integration |
| 7 | **Audit Logger** | Immutable append-only log of every agent action, decision, and data transit | DORA Art. 11 aligned, AI Act Art. 12 compliant |
| 8 | **Human-above-the-Loop Governance** | Auto-Execute / Escalate / Block rules engine + approval UI for tier-2 decisions (credit advice, investment suggestions) | AI Act Art. 14 compliant — high-risk AI requires human oversight |

### 3.3 Data flow

```
         [ČS Core Banking API — synthetic stub]
                        │
                        ▼
               (1) Ingestion Agent
                        │  raw transactions
                        ▼
              (2) PII Redaction Layer
                        │  anonymized transactions
                        ▼
              (3) Categorization Agent
                        │  classified transactions
                        ▼
                (4) Anomaly Agent
                        │  transactions + anomaly flags
                        ▼
                (5) Insight Agent
                        │  draft report + reasoning trace
                        ▼
          ┌──── (8) Governance gate ────┐
          │                             │
    (auto path)                 (escalate path)
          │                             │
          │                  [ Human approval UI ]
          │                             │
          │                      (after approval)
          │                             │
          ▼                             ▼
               (6) Report Composer
                        │  formatted output
                        ▼
                  [ George app ]

                    (7) Audit Logger
              (listens on every edge above,
               writes immutable event log)
```

Every arrow in the diagram emits an audit event. The audit logger is cross-cutting, not sequential.

---

## 4. Scope

### 4.1 In scope — 10-day tech spike (2026-04-11 → 2026-04-20)

- End-to-end running implementation of **all 8 layers** against **synthetic data** (3 customer personas).
- Synthetic ČS transaction generator (Python) producing realistic Czech banking transactions for 90 days per persona.
- Claude Agent SDK for agent definitions.
- Python + FastAPI backbone.
- Simple Next.js UI showing the generated customer report + governance approval screen.
- Metrics dashboard: latency, categorization accuracy, PII leakage count (must be 0), hallucination rate (target < 2%).
- Screencast of full end-to-end flow as meeting backup (laptop failure insurance).
- `docker-compose up` for local reproducibility.

### 4.2 In scope — 4-6 week POC commitment (post-approval)

- Production-grade implementation on **AWS Bedrock (Frankfurt region — EU data residency)**.
- Integration with NOTIX Java backend stub (live ČS infra remains out of POC scope for compliance reasons; ČS will remain synthetic).
- Full compliance artifacts package:
  - AI Act risk classification memo (likely high-risk given credit-adjacent outputs under Annex III).
  - DORA-aligned audit log schema.
  - GDPR DPIA template.
  - Threat model (STRIDE).
- ROI calculation document: retention uplift, CSAT impact, fraud prevention value (benchmark-based, transparent sources).
- Staging deployment on NOTIX infrastructure (or Steve's infra, TBD with NOTIX in meeting).
- End-to-end demo + handoff documentation (Czech + English).

### 4.3 Explicitly out of scope

- **Real ČS customer data.** Synthetic only, for the duration of the spike and the POC.
- **Real ČS production integration.** POC phase uses NOTIX Java stub.
- **Real money movement.** No transfers, no trades, no outbound financial actions.
- **Multi-tenant / multi-bank support.** ČS-specific narrative; generalizable later but not now.
- **NotixOS / AgentForgeOS brand conversation** in the meeting. Deferred to month 4-6 HPP per discipline.
- **Customer-facing mobile or web client.** We produce the report API and admin/governance UI; George app integration is NOTIX's responsibility.
- **Any DataPalo / PromptPro / AI Code Support code mixed into the POC.** The IP carve-out must stay clean — the POC is a new body of work, not a recomposition of Steve's existing products.

---

## 5. Target personas (synthetic data seeds)

Three personas run through the 8-layer pipeline. Each report must demonstrably differ in tone, recommendations, and risk flags.

- **Persona A — Young professional.** 28, single, Prague, IT consultant, ~60 000 CZK net/mo. Spend: rent, restaurants, travel, subscription services, occasional investment transfers. Goal of report: find savings, optimize cash flow, travel planning.
- **Persona B — Family.** 38, married with 2 kids, Brno, both partners working. Combined ~110 000 CZK net/mo. Spend: mortgage, groceries, kids' expenses, car, utilities, vacations. Goal of report: budget discipline, detect anomalies, plan ahead.
- **Persona C — Senior.** 67, retired, Nový Bor. Pension ~25 000 CZK net/mo. Spend: pharmacy, groceries, utilities, occasional gifts or travel. Goal of report: prevent fraud, simplify understanding, elder-friendly language and recommendations.

Each persona is designed to trigger at least one governance escalation in the spike demo (fraud flag for C, investment-adjacent recommendation for A, high-value anomaly for B). This is so the Human-above-the-Loop layer is **visibly exercised** during the NOTIX demo, not just theoretical.

---

## 6. Compliance framing (AI Act, GDPR, DORA, MiFID II)

Every layer has an explicit compliance justification. **This is the core differentiator** from "I built a chatbot over banking data" demos. NOTIX already has Java seniors. They do not have someone who can stand in a compliance review and defend the architecture against ČNB, EBA, or an internal risk committee. That is what Steve brings.

| Requirement | Source | How the spike addresses it |
|---|---|---|
| Human oversight for high-risk AI | AI Act Art. 14 | Layer 8 governance escalates tier-2 decisions (credit advice, investment suggestions) to human approval **before** report reaches customer |
| Automatic record keeping | AI Act Art. 12 | Layer 7 audit logger writes immutable event log for every agent action |
| Data minimization | GDPR Art. 5(1)(c) | Layer 2 strips PII before any data leaves the system boundary to an LLM |
| Lawful basis + right to explanation | GDPR Art. 6, Art. 22; AI Act Art. 13 | Insight Agent emits reasoning trace alongside recommendation; governance layer attaches decision rationale to every escalation |
| ICT risk management, audit trail | DORA Art. 5, Art. 11 | Audit log schema aligned with DORA record-keeping requirements; spike ships a compliant schema draft |
| Risk classification of AI system | AI Act Art. 6, Annex III | POC deliverable includes explicit classification memo. Expected outcome: high-risk (credit-adjacent) |
| Suitability test for investment recommendations | MiFID II Art. 25 | Governance layer blocks any investment-adjacent recommendation that does not carry a suitability check |

---

## 7. Success metrics

### 7.1 Spike (meeting readiness, by 2026-04-20)

- End-to-end latency **< 3 seconds** per persona report
- Categorization accuracy **> 92%** on synthetic test set
- PII leakage count **= 0** (measured by redaction audit at every LLM boundary)
- Hallucination rate **< 2%** on insight generation (measured against synthetic ground truth)
- Governance gate correctly escalates tier-2 recommendations in **100%** of test cases
- All 8 layers demonstrable end-to-end on Steve's laptop in **under 2 minutes**
- Screencast backup recorded and verified playable

### 7.2 POC (4-6 weeks post-approval)

- All spike metrics upheld on production-grade infrastructure
- Staging environment accessible to NOTIX and Petr Hnízdil
- Complete compliance artifacts delivered (AI Act memo, DORA schema, GDPR DPIA, STRIDE threat model)
- Signed handoff document from Petr Hnízdil (NOTIX AI lead)
- ROI calculation delivered with transparent benchmark sources

---

## 8. Constraints & assumptions

- **No access to real ČS data or infra.** Everything synthetic during spike and POC.
- **Claude Agent SDK + AWS Bedrock Frankfurt** as default stack for the POC. Claude Agent SDK local / direct API for spike (faster iteration). Subject to NOTIX input in meeting.
- **Python + FastAPI + Next.js** for the spike (fastest solo build path).
- **Steve solo + Claude as pair** for all 10 days. No external contractors, no NOTIX engineer involvement, no DataPalo/AI Code Support code reuse.
- **Meeting framing:** the spike is shown in the meeting as *proof of capability and velocity*, **not** as "finished POC". Steve must explicitly frame it that way (verbatim: *"Tohle je spike, postavil jsem ho o víkendu jako proof-of-concept rychlosti a feasibility. Skutečný POC s production-ready compliance, metrikami a staging deploymentem je těch 4-6 týdnů, které vám navrhuju."*) to avoid the "you already delivered, we don't owe anything" trap.
- **Fetch to origin is currently failing** with `LibreSSL SSL_connect: SSL_ERROR_SYSCALL` — may be VPN/network-local. Non-blocking for now but needs resolution before first push.
- **DataPalo maintenance mode for 6-12 months accepted by Steve** (2026-04-11). Only bug fixes, no new features — all code capacity reserved for NOTIX spike until meeting.

---

## 9. Open questions

| # | Question | Owner | Decide by |
|---|---|---|---|
| 1 | Does the spike code live in `forge-tool/notix-poc/` subdirectory, or in a separate repo? | Steve | Before Day 2 (Sun 12.4.) bootstrap |
| 2 | Does NOTIX want POC staging on their infra or Steve's? | Steve + NOTIX | In meeting 21.4. |
| 3 | Exact Czech/English language split for the report output? Default: Czech for persona reports, English for internal/compliance artifacts | Steve | Day 4-5 when Insight Agent is built |
| 4 | IP carve-out contract text — draft by Steve + Claude, then reviewed by Czech IP lawyer before meeting | Steve + external lawyer | Day 7-8 (Fri 17.4. – Sat 18.4.) |
| 5 | Final brand decision AgentForgeOS / NotixOS / co-branded | Steve | Deferred — month 4-6 HPP |
| 6 | Does `fix/datapalo-mobile-responsive` push target still make sense for this POC, or does it need its own remote branch (`feat/notix-poc-banking-agent`)? | Steve + Claude | Before Day 2 first push |

---

## 10. Deliverables (by end of 2026-04-20, day before meeting)

Steve should hold in hand:

1. **This design document** — printed + PDF for internal reference.
2. **POC proposal document** — 2-3 page professional handout for NOTIX, distilled from this doc, translated to Czech.
3. **Running tech spike** — `docker-compose up` on Steve's laptop, demonstrable in under 2 minutes, backup screencast recorded.
4. **Metrics report** — latency / accuracy / PII / hallucination numbers from all 3 personas.
5. **Updated pitch deck (v3)** — v2 deck + new POC slide (8-layer architecture) + compliance slide + ROI slide + human-above-the-loop slide.
6. **IP carve-out draft** — contract language for red-line DataPalo / PromptPro / AI Code Support / AgentForge.Tech / Forge Creative exclusion, reviewed by Czech IP lawyer.
7. **Q&A rehearsal notes** — 3 rounds of tough-question prep (technical / business / portfolio), including red-lines conversation script ("how to refuse HPP without IP carve-out without killing the deal").

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Spike doesn't reach 8 layers in 10 days | Medium | Medium | Fallback: seškrtnout Layers 4 (Anomaly) and 8 (Governance). Keep 1-3, 5-7 for an end-to-end "upload → redact → categorize → insight → report → audit" story. Still a strong proof. |
| Meeting audience (Jiří Šlefr / Petr Hnízdil) treats the spike as "already delivered POC" and tries to negotiate out of POC payment | Medium | High | Explicit framing script in Steve's close. Rehearsed in Day 9 dry run. |
| NOTIX insists on standard HPP contract without IP carve-out | Medium | High | Red-lines conversation training on Day 9. Fallback to B2B IČO 1800/h contract (less cash-flow security but IP-safe). |
| Steve burns out during the 10-day sprint and delivers poorly at the meeting | Medium | High | Buffer day 10 (Mon 20.4.) is sacred. No code, only light review + early sleep. |
| Fetch/push issues (current SSL error) block Git sync | Low | Low | Local commits are fine; sync resolved before first push. Worst case, work purely local until meeting day. |
| Real-world event (illness, family, NOTIX reschedules) | Low | High | Not in Claude's control. Flag to Steve immediately if it happens; replan. |

---

## 12. Phases & timeline

See `docs/superpowers/plans/2026-04-11-notix-poc-plan.md` (to be written next via `writing-plans` skill) for the detailed per-day task breakdown. High-level schedule:

- **Day 1 (Sat 11.4.)** — This design doc + user review.
- **Day 2 (Sun 12.4.)** — Spike bootstrap, synthetic data generator, Layers 1-2.
- **Day 3 (Mon 13.4.)** — Steve on pitch prep; Claude on Layer 3.
- **Day 4 (Tue 14.4.)** — Layers 4-5.
- **Day 5 (Wed 15.4.)** — Layers 6-7 + minimal Next.js UI.
- **Day 6 (Thu 16.4.)** — Layer 8 (governance) + end-to-end test.
- **Day 7 (Fri 17.4.)** — IP carve-out draft, spike polish.
- **Day 8 (Sat 18.4.)** — Spike final polish, metrics, screencast, deck v3 finalization.
- **Day 9 (Sun 19.4.)** — Dry run rehearsal.
- **Day 10 (Mon 20.4.)** — Buffer, printed materials, early sleep.
- **Day 11 (Tue 21.4. 10:00)** — Meeting. Steve delivers. Claude on standby.

---

## 13. Decision log

- **2026-04-11** — AgentForgeOS = consulting + implementation framework (not a standalone product). Locked by Steve.
- **2026-04-11** — First stone = banking agent for ČS use case (option B), with governance layer (option A) embedded as Layer 8 for differentiation — hybrid, not either/or. Locked by Steve.
- **2026-04-11** — Primary goal of NOTIX meeting: HPP 200 000 CZK gross/month + paid POC. IP carve-out = red line. Locked by Steve in `project_notix_meeting.md`.
- **2026-04-11** — NotixOS / AgentForgeOS brand conversation deferred to month 4-6 HPP. Locked.
- **2026-04-11** — Spike shown in meeting as proof-of-capability, not finished POC. Must be framed explicitly by Steve in Czech opening of the POC section.
- **2026-04-11** — DataPalo maintenance mode for 6-12 months accepted by Steve. Only bug fixes.
- **2026-04-11** — Fresh worktree `feat/notix-poc-banking-agent` created off `origin/main` at `2546c91`. `.claude/` added to `.gitignore` as safety net (commit `ca6702d`).

---

*This is the first kámen of the AgentForgeOS vision. If it ships, it ships. If it doesn't, we write kámen #2 and retroactively decide the shape of the whole.*
