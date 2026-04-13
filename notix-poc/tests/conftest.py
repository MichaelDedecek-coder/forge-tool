"""Shared pytest fixtures for the notix-poc spike.

Real fixtures (mock LLM, sample personas, in-memory audit DB) are added
as the corresponding layers are implemented (see implementation plan
Day 2-6).
"""

from pathlib import Path

import pytest
from dotenv import load_dotenv

from agents.audit_logger import AuditLogger

# Load .env globally so all tests have access to ANTHROPIC_API_KEY etc.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@pytest.fixture
def audit_log(tmp_path):
    return AuditLogger(db_path=str(tmp_path / "audit.db"))
