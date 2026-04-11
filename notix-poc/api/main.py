"""NOTIX POC FastAPI entry point.

Single endpoint POST /api/poc/analyze takes a persona ID and runs
the 8-layer pipeline. UI hits this endpoint.

Routes are added incrementally as each layer ships (see implementation
plan Day 2-6). Day 1 ships only /health.
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
