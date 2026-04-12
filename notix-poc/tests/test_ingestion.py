import pytest
from agents.ingestion import IngestionAgent


@pytest.fixture
def agent():
    return IngestionAgent(samples_dir="data/samples")


def test_returns_transactions_for_known_persona(agent):
    txs = agent.fetch("persona_a")
    assert len(txs) > 0
    for tx in txs:
        assert "merchant" in tx
        assert "amount_czk" in tx


def test_raises_for_unknown_persona(agent):
    with pytest.raises(ValueError, match="Unknown persona"):
        agent.fetch("persona-z")
