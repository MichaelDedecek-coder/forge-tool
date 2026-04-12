"""Shared pytest fixtures for the notix-poc spike.

Real fixtures (mock LLM, sample personas, in-memory audit DB) are added
as the corresponding layers are implemented (see implementation plan
Day 2-6).
"""

import pytest
from agents.audit_logger import AuditLogger


@pytest.fixture
def audit_log(tmp_path):
    return AuditLogger(db_path=str(tmp_path / "audit.db"))
