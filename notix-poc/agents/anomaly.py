"""Layer 4 — Anomaly Agent (statistical + heuristic fraud/spending detection).

Detects:
- High-value outlier: single transaction > 3x the 95th percentile amount.
- Card-not-present fraud: high-value online transaction (>= 2000 CZK)
  with card_present=False (excludes financial institution MCCs 6000-6299).
- Velocity anomaly: stub (production POC implements time-window analysis).
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


# MCC codes for financial/investment transactions that are excluded from
# card-not-present fraud detection (e.g. 6211 = Security Brokers/Dealers).
_FINANCIAL_MCC_RANGE = range(6000, 6300)

# Minimum number of transactions required to compute a meaningful percentile.
_MIN_TRANSACTIONS_FOR_PERCENTILE = 10

# Card-not-present fraud threshold (CZK).
_CNP_FRAUD_THRESHOLD = Decimal("2000")

# High-value outlier multiplier applied to the 95th percentile.
_OUTLIER_MULTIPLIER = Decimal("3")


@dataclass
class AnomalyFlag:
    type: str           # "high_value_outlier" | "card_not_present_fraud" | "velocity_anomaly"
    severity: str       # "low" | "medium" | "high" | "critical"
    transaction_index: int
    reason_cz: str      # Czech explanation for the user-facing report


class AnomalyAgent:
    LAYER_NAME = "anomaly"

    def __init__(self, audit=None):
        self.audit = audit

    def detect(self, transactions: list[dict[str, Any]]) -> list[AnomalyFlag]:
        flags: list[AnomalyFlag] = []
        flags.extend(self._detect_high_value_outliers(transactions))
        flags.extend(self._detect_card_not_present_fraud(transactions))
        flags.extend(self._detect_velocity(transactions))

        if self.audit:
            self.audit.log_event(
                layer=self.LAYER_NAME,
                action="detect",
                metadata={
                    "total_transactions": len(transactions),
                    "flags_count": len(flags),
                    "critical_count": sum(1 for f in flags if f.severity == "critical"),
                },
            )

        return flags

    # ------------------------------------------------------------------
    # Private detection methods
    # ------------------------------------------------------------------

    def _detect_high_value_outliers(
        self, transactions: list[dict[str, Any]]
    ) -> list[AnomalyFlag]:
        if len(transactions) < _MIN_TRANSACTIONS_FOR_PERCENTILE:
            return []

        amounts = sorted(
            Decimal(str(tx["amount_czk"])) for tx in transactions
        )

        p95 = _percentile95(amounts)
        threshold = p95 * _OUTLIER_MULTIPLIER

        flags: list[AnomalyFlag] = []
        for idx, tx in enumerate(transactions):
            amount = Decimal(str(tx["amount_czk"]))
            if amount > threshold:
                flags.append(
                    AnomalyFlag(
                        type="high_value_outlier",
                        severity="high",
                        transaction_index=idx,
                        reason_cz=(
                            f"Transakce ve výši {amount} Kč je výrazně nad "
                            f"vaším obvyklým rozsahem."
                        ),
                    )
                )

        return flags

    def _detect_card_not_present_fraud(
        self, transactions: list[dict[str, Any]]
    ) -> list[AnomalyFlag]:
        flags: list[AnomalyFlag] = []

        for idx, tx in enumerate(transactions):
            card_present = tx.get("card_present", True)
            if card_present:
                continue

            amount = Decimal(str(tx["amount_czk"]))
            if amount < _CNP_FRAUD_THRESHOLD:
                continue

            # Exclude legitimate financial/investment transactions.
            mcc_raw = tx.get("mcc_code")
            if mcc_raw is not None:
                try:
                    mcc = int(mcc_raw)
                    if mcc in _FINANCIAL_MCC_RANGE:
                        continue
                except (ValueError, TypeError):
                    pass

            merchant = tx.get("merchant", "neznámý obchodník")
            flags.append(
                AnomalyFlag(
                    type="card_not_present_fraud",
                    severity="critical",
                    transaction_index=idx,
                    reason_cz=(
                        f"Online transakce {amount} Kč u {merchant} — karta nebyla "
                        f"fyzicky přítomna. Možný podvod."
                    ),
                )
            )

        return flags

    def _detect_velocity(
        self, transactions: list[dict[str, Any]]  # noqa: ARG002
    ) -> list[AnomalyFlag]:
        """Stub: production POC implements time-window spike analysis."""
        return []


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _percentile95(sorted_values: list[Decimal]) -> Decimal:
    """Return the 95th percentile of a pre-sorted list using linear interpolation."""
    n = len(sorted_values)
    if n == 0:
        return Decimal("0")
    if n == 1:
        return sorted_values[0]

    # Use the nearest-rank method for simplicity.
    rank = Decimal("0.95") * (n - 1)
    lower = int(rank)
    upper = lower + 1
    if upper >= n:
        return sorted_values[-1]

    fraction = rank - lower
    return sorted_values[lower] + fraction * (sorted_values[upper] - sorted_values[lower])
