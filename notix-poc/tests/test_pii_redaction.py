"""Layer 2 — PII Redaction Layer strips Czech PII before any data
reaches an LLM. GDPR Art. 5(1)(c) data minimization compliance is
the contract: leakage count MUST be 0.
"""

import json
import pytest
from agents.pii_redaction import PIIRedactor


def test_redacts_iban():
    redactor = PIIRedactor()
    text = "Platba na účet CZ6508000000192000145399 byla úspěšná."
    result = redactor.redact_text(text)
    assert "CZ6508000000192000145399" not in result
    assert "[IBAN_REDACTED]" in result


def test_valid_iban_is_redacted_invalid_iban_is_not():
    """IBAN with correct format but failed mod-97 checksum must NOT be
    redacted — it is a false positive (random number sequence), not real PII.

    Checksum check prevents spurious redactions that degrade downstream
    text quality without improving privacy.
    """
    redactor = PIIRedactor()

    valid = "CZ6508000000192000145399"    # real, checksum passes
    invalid = "CZ9999000000192000145399"  # correct format, checksum fails

    valid_result = redactor.redact_with_counts(f"Platba {valid} proběhla.")
    assert valid not in valid_result.text
    assert valid_result.redactions_by_type.get("iban") == 1

    invalid_result = redactor.redact_with_counts(f"Číslo {invalid} je náhoda.")
    assert "[IBAN_REDACTED]" not in invalid_result.text
    assert "iban" not in invalid_result.redactions_by_type


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
    """The spike's headline metric: across all persona-c transactions,
    PII leakage count = 0 after redaction."""
    from agents.ingestion import IngestionAgent

    agent = IngestionAgent(samples_dir="data/samples")
    transactions = agent.fetch("persona_c")

    # Get the account holder name from first transaction
    first_name = transactions[0].get("account_holder_name", "")
    first_iban = transactions[0].get("iban", "")

    redactor = PIIRedactor(known_names=[first_name] if first_name else [])

    leaked = 0
    for tx in transactions:
        redacted = redactor.redact_transaction(tx)
        serialized = json.dumps(redacted)
        if first_iban and first_iban in serialized:
            leaked += 1
        if first_name and first_name in serialized:
            leaked += 1

    assert leaked == 0, f"PII leakage = {leaked} (expected 0)"
