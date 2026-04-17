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

    def __init__(self, known_names: list[str] | None = None):
        self.known_names = known_names or []

    @staticmethod
    def _iban_is_valid(iban: str) -> bool:
        """ISO 13616 mod-97 checksum. Prevents redaction of 26-char number
        sequences that happen to start with CZ but aren't real IBANs."""
        normalized = re.sub(r"\s", "", iban).upper()
        rearranged = normalized[4:] + normalized[:4]
        numeric = "".join(
            str(ord(ch) - 55) if ch.isalpha() else ch for ch in rearranged
        )
        try:
            return int(numeric) % 97 == 1
        except ValueError:
            return False

    def redact_text(self, text: str) -> str:
        return self.redact_with_counts(text).text

    def redact_with_counts(self, text: str) -> RedactionResult:
        counts: dict[str, int] = {}

        iban_count = 0
        def _iban_repl(match: re.Match) -> str:
            nonlocal iban_count
            if self._iban_is_valid(match.group(0)):
                iban_count += 1
                return "[IBAN_REDACTED]"
            return match.group(0)
        text = self.IBAN_RE.sub(_iban_repl, text)
        if iban_count: counts["iban"] = iban_count

        text, n = self.RC_RE.subn("[RC_REDACTED]", text)
        if n: counts["rc"] = n

        text, n = self.PHONE_RE.subn("[PHONE_REDACTED]", text)
        if n: counts["phone"] = n

        text, n = self.ACCOUNT_RE.subn("[ACCOUNT_REDACTED]", text)
        if n: counts["account"] = n

        for name in self.known_names:
            count_before = text.count(name)
            text = text.replace(name, "[NAME_REDACTED]")
            if count_before:
                counts["name"] = counts.get("name", 0) + count_before

        return RedactionResult(text=text, redactions_by_type=counts)

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
