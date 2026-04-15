"""NOTIX POC FastAPI entry point."""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure notix-poc is in Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from agents.pipeline import Pipeline

app = FastAPI(
    title="NOTIX POC — Banking Customer Insight Agent",
    description="8-layer agent with embedded AI Act / GDPR / DORA governance",
    version="0.1.0",
)

# CORS for local development (HTML opens from file:// or different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline (singleton for the app lifecycle)
pipeline = Pipeline(
    samples_dir=str(Path(__file__).resolve().parent.parent / "data" / "samples"),
    categorization_strategy=os.environ.get("CATEGORIZATION_STRATEGY", "rules"),
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/poc/analyze/{persona_id}")
async def analyze_persona(persona_id: str):
    """Run the full 8-layer pipeline for a persona.

    Valid persona_ids: persona_a, persona_b, persona_c
    """
    valid = {"persona_a", "persona_b", "persona_c"}
    if persona_id not in valid:
        raise HTTPException(status_code=404, detail=f"Unknown persona: {persona_id}. Valid: {', '.join(valid)}")

    try:
        result = pipeline.run(persona_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/poc/personas")
async def list_personas():
    """List available demo personas."""
    return {
        "personas": [
            {"id": "persona_a", "label": "Mladý profesionál · 28 let · Praha"},
            {"id": "persona_b", "label": "Rodina · 38 let · Brno"},
            {"id": "persona_c", "label": "Senior · 67 let · Nový Bor"},
        ]
    }
