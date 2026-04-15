import pytest


def test_pipeline_runs_end_to_end_rules(tmp_path):
    """Full pipeline with rules strategy (no LLM, fast, deterministic)."""
    from agents.pipeline import Pipeline

    pipeline = Pipeline(
        samples_dir="data/samples",
        categorization_strategy="rules",
        audit_db_path=str(tmp_path / "test_audit.db"),
    )
    # Use rules strategy — no ANTHROPIC_API_KEY needed
    # But insight agent (Layer 5) needs LLM...
    # So this test only works with API key
    # Skip if no key
    import os
    if not os.environ.get("ANTHROPIC_API_KEY"):
        pytest.skip("ANTHROPIC_API_KEY not set")

    result = pipeline.run("persona_c")

    assert result["persona_id"] == "persona_c"
    assert result["pii_leakage_count"] == 0
    assert result["agent_count"] == 8
    assert len(result["spending_cards"]) > 0
    assert len(result["sections"]) > 0
    assert "Finanční přehled" in result["markdown_cz"]
    assert result["generation_time_s"] > 0


@pytest.mark.llm
def test_pipeline_runs_for_all_personas(tmp_path):
    """Run pipeline for all 3 personas, verify each produces a report."""
    from agents.pipeline import Pipeline

    pipeline = Pipeline(
        samples_dir="data/samples",
        categorization_strategy="rules",
        audit_db_path=str(tmp_path / "test_audit.db"),
    )

    for pid in ["persona_a", "persona_b", "persona_c"]:
        result = pipeline.run(pid)
        assert result["persona_id"] == pid
        assert result["pii_leakage_count"] == 0
        assert len(result["sections"]) >= 1


def test_pipeline_raises_for_unknown_persona(tmp_path):
    from agents.pipeline import Pipeline
    pipeline = Pipeline(
        samples_dir="data/samples",
        audit_db_path=str(tmp_path / "test_audit.db"),
    )
    with pytest.raises(ValueError, match="Unknown persona"):
        pipeline.run("persona_z")
