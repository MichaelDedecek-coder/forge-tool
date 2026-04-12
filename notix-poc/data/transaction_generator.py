"""Synthetic Czech banking transaction generator for NOTIX POC.

Generates deterministic, realistic Czech banking transactions for each
persona defined in data/personas.py. Designed to feed all downstream
layers (Ingestion, PII Redaction, Categorization, Anomaly, Insight, etc.).

Usage:
    # As a library
    from data.transaction_generator import generate_transactions
    txs = generate_transactions(PERSONA_A, days=90, seed=42)

    # As a script (generates data/samples/*.json)
    python -m data.transaction_generator
"""

from __future__ import annotations

import json
import random
from dataclasses import asdict, dataclass
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Optional

from data.personas import ALL_PERSONAS, PERSONA_A, PERSONA_B, PERSONA_C, Persona


# ---------------------------------------------------------------------------
# Transaction dataclass
# ---------------------------------------------------------------------------

@dataclass
class Transaction:
    date: date
    merchant: str
    amount_czk: Decimal
    mcc_code: str
    currency: str
    account_holder_name: str  # PII — redacted in Layer 2
    iban: str                 # PII — redacted in Layer 2
    card_present: bool
    scenario_marker: Optional[str] = None


# ---------------------------------------------------------------------------
# Czech merchant + MCC pools keyed by category
# ---------------------------------------------------------------------------

MERCHANT_POOL: dict[str, list[tuple[str, str]]] = {
    # (merchant_name, mcc_code)
    "Bydlení": [
        ("Správa domu – nájem", "6513"),
        ("Reality Praha s.r.o.", "6513"),
    ],
    "Předplatné": [
        ("Netflix CZ", "5815"),
        ("Spotify AB", "5815"),
        ("HBO Max CZ", "5815"),
        ("O2 TV", "4899"),
    ],
    "Doprava (MHD)": [
        ("DPP – Dopravní podnik Praha", "4111"),
        ("IDOS – jízdenka", "4111"),
        ("Lítačka Praha", "4111"),
    ],
    "Hypotéka": [
        ("Česká spořitelna – splátka hypotéky", "6159"),
    ],
    "Energie": [
        ("ČEZ Prodej s.r.o.", "4911"),
        ("E.ON Energie CZ", "4911"),
        ("Pražská plynárenská", "4924"),
    ],
    "Děti (školka, kroužky)": [
        ("MŠ Sluníčko Brno", "8351"),
        ("TJ Sokol Brno – kroužky", "7941"),
        ("Jazyková škola EduKid", "8299"),
    ],
    "Auto (leasing + pojištění)": [
        ("Škoda Leasing a.s.", "5521"),
        ("Allianz pojišťovna", "6411"),
        ("Kooperativa pojišťovna", "6411"),
    ],
    "Léky a zdravotnictví": [
        ("Lékárna U Zlatého Lva", "5912"),
        ("Dr.Max lékárna", "5912"),
        ("Lékárna Nový Bor", "5912"),
        ("Nemocnice Česká Lípa", "8011"),
    ],
    "Restaurace": [
        ("Restaurace U Fleků", "5812"),
        ("Café Imperial Praha", "5812"),
        ("Bistro Na Příkopě", "5812"),
        ("Sushi Bar Vinohrady", "5812"),
        ("Burger King Anděl", "5814"),
        ("McDonald's Smíchov", "5814"),
    ],
    "Cestování": [
        ("Czech Airlines", "3000"),
        ("Booking.com", "7011"),
        ("Airbnb Ireland", "7011"),
        ("RegioJet a.s.", "4112"),
        ("FlixBus CZ", "4131"),
    ],
    "Elektronika": [
        ("Alza.cz a.s.", "5734"),
        ("CZC.cz s.r.o.", "5734"),
        ("Apple Store Praha", "5734"),
        ("Datart International", "5732"),
    ],
    "Sport": [
        ("Decathlon Praha", "5941"),
        ("Sportisimo s.r.o.", "5941"),
        ("Holmes Place Praha", "7997"),
        ("FitPark Smíchov", "7997"),
    ],
    "Potraviny": [
        ("Albert hypermarket", "5411"),
        ("Lidl Česká republika", "5411"),
        ("Tesco Stores ČR", "5411"),
        ("Billa CZ s.r.o.", "5411"),
        ("Kaufland CZ", "5411"),
        ("Penny Market CZ", "5411"),
    ],
    "Drogerie": [
        ("dm drogerie markt", "5912"),
        ("Rossmann CZ", "5912"),
        ("Teta drogerie", "5912"),
    ],
    "Dovolená": [
        ("Čedok a.s.", "4722"),
        ("Exim Tours CZ", "4722"),
        ("Booking.com (hotel)", "7011"),
    ],
    "Domácnost": [
        ("IKEA Brno", "5712"),
        ("OBI Brno", "5251"),
        ("Hornbach CZ", "5251"),
    ],
    "Dárky": [
        ("Florea kvety Nový Bor", "5992"),
        ("Knihkupectví Dobrovský", "5942"),
        ("Zlatnictví Veselý", "5944"),
    ],
    "Drobné nákupy": [
        ("Tabák & Tisk Nový Bor", "5994"),
        ("Jednota COOP", "5411"),
        ("Farmářské trhy", "5411"),
    ],
}

# ---------------------------------------------------------------------------
# Persona PII mappings
# ---------------------------------------------------------------------------

_PERSONA_PII: dict[str, tuple[str, str]] = {
    "persona-a": ("Jan Novák", "CZ6508000000192000145399"),
    "persona-b": ("Petra Dvořáková", "CZ5527000000004820613910"),
    "persona-c": ("Jiří Svoboda", "CZ0100000000007654321001"),
}

# ---------------------------------------------------------------------------
# Amount ranges per category (min, max in CZK)
# ---------------------------------------------------------------------------

_AMOUNT_RANGE: dict[str, tuple[float, float]] = {
    "Restaurace": (180.0, 950.0),
    "Cestování": (500.0, 8000.0),
    "Elektronika": (300.0, 12000.0),
    "Sport": (200.0, 3500.0),
    "Potraviny": (120.0, 2800.0),
    "Drogerie": (80.0, 600.0),
    "Dovolená": (1200.0, 15000.0),
    "Domácnost": (300.0, 6000.0),
    "Dárky": (100.0, 1200.0),
    "Drobné nákupy": (20.0, 400.0),
}

# Average number of discretionary transactions per month per category
_FREQ_PER_MONTH: dict[str, float] = {
    "Restaurace": 8.0,
    "Cestování": 1.5,
    "Elektronika": 0.7,
    "Sport": 3.0,
    "Potraviny": 14.0,
    "Drogerie": 4.0,
    "Dovolená": 0.5,
    "Domácnost": 2.0,
    "Dárky": 1.0,
    "Drobné nákupy": 6.0,
}


# ---------------------------------------------------------------------------
# Core generator
# ---------------------------------------------------------------------------

def generate_transactions(persona: Persona, days: int = 90, seed: int = 42) -> list[Transaction]:
    """Generate synthetic Czech banking transactions for a persona.

    Args:
        persona: The Persona to generate transactions for.
        days: Number of calendar days to generate data for (from today - days).
        seed: Random seed for full determinism.

    Returns:
        List of Transaction objects sorted by date ascending.
    """
    rng = random.Random(seed)

    start_date = date(2026, 1, 1)  # fixed anchor for reproducibility
    end_date = start_date + timedelta(days=days - 1)

    holder_name, iban = _PERSONA_PII[persona.id]

    transactions: list[Transaction] = []

    # --- Monthly recurring transactions ---
    current = start_date.replace(day=1)
    while current <= end_date:
        for category, amount in persona.monthly_recurring_categories.items():
            # Pick a day in this month (roughly same day each month, small jitter)
            day_offset = rng.randint(0, 4)
            tx_date = current + timedelta(days=day_offset)
            if tx_date > end_date:
                tx_date = current  # clamp to month start if jitter pushes past end

            merchant, mcc = _pick_merchant(rng, category)
            # Small amount jitter ±5%
            jitter = Decimal(str(round(rng.uniform(0.95, 1.05), 4)))
            tx_amount = (amount * jitter).quantize(Decimal("0.01"))

            transactions.append(Transaction(
                date=tx_date,
                merchant=merchant,
                amount_czk=tx_amount,
                mcc_code=mcc,
                currency="CZK",
                account_holder_name=holder_name,
                iban=iban,
                card_present=True,
                scenario_marker=None,
            ))

        # Advance to next month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1, day=1)
        else:
            current = current.replace(month=current.month + 1, day=1)

    # --- Discretionary transactions ---
    total_months = days / 30.0
    for category in persona.discretionary_categories:
        freq = _FREQ_PER_MONTH.get(category, 2.0)
        n_transactions = max(1, round(total_months * freq))
        lo, hi = _AMOUNT_RANGE.get(category, (100.0, 2000.0))

        for _ in range(n_transactions):
            tx_date = start_date + timedelta(days=rng.randint(0, days - 1))
            if tx_date > end_date:
                tx_date = end_date

            merchant, mcc = _pick_merchant(rng, category)
            amount = Decimal(str(round(rng.uniform(lo, hi), 2)))

            transactions.append(Transaction(
                date=tx_date,
                merchant=merchant,
                amount_czk=amount,
                mcc_code=mcc,
                currency="CZK",
                account_holder_name=holder_name,
                iban=iban,
                card_present=rng.random() > 0.15,  # 15% chance card not present (online)
                scenario_marker=None,
            ))

    # --- Persona C: ensure pharmacy transactions from recurring category appear ---
    # Léky a zdravotnictví recurring already generates lékárna transactions.
    # Add extra dedicated pharmacy transactions to ensure >= 3 for the test.
    if persona.id == "persona-c":
        pharmacy_merchants = [m for m in MERCHANT_POOL["Léky a zdravotnictví"] if "lékárna" in m[0].lower()]
        # Ensure at least 4 dedicated pharmacy entries spread across the period
        for i in range(4):
            tx_date = start_date + timedelta(days=rng.randint(0, days - 1))
            merchant, mcc = pharmacy_merchants[i % len(pharmacy_merchants)]
            amount = Decimal(str(round(rng.uniform(80.0, 600.0), 2)))
            transactions.append(Transaction(
                date=tx_date,
                merchant=merchant,
                amount_czk=amount,
                mcc_code=mcc,
                currency="CZK",
                account_holder_name=holder_name,
                iban=iban,
                card_present=True,
                scenario_marker=None,
            ))

    # --- Inject scenario triggers ---
    for scenario in persona.triggered_scenarios:
        tx = _build_scenario_transaction(rng, scenario, holder_name, iban, start_date, end_date)
        if tx:
            transactions.append(tx)

    # Sort by date ascending
    transactions.sort(key=lambda t: t.date)
    return transactions


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _pick_merchant(rng: random.Random, category: str) -> tuple[str, str]:
    """Return (merchant_name, mcc_code) for a given category."""
    pool = MERCHANT_POOL.get(category)
    if not pool:
        return ("Obchod", "5999")
    return rng.choice(pool)


def _build_scenario_transaction(
    rng: random.Random,
    scenario: str,
    holder_name: str,
    iban: str,
    start_date: date,
    end_date: date,
) -> Optional[Transaction]:
    """Build the single injected scenario transaction."""
    # Place scenario transaction in the second half of the period to look realistic
    period = (end_date - start_date).days
    tx_date = start_date + timedelta(days=rng.randint(period // 2, period))

    if scenario == "investment_recommendation":
        return Transaction(
            date=tx_date,
            merchant="Fio banka – nákup ETF iShares Core MSCI",
            amount_czk=Decimal("15000.00"),
            mcc_code="6211",
            currency="CZK",
            account_holder_name=holder_name,
            iban=iban,
            card_present=False,
            scenario_marker="investment_recommendation",
        )

    if scenario == "high_value_anomaly":
        return Transaction(
            date=tx_date,
            merchant="Autosalon Porsche Praha",
            amount_czk=Decimal("75000.00"),
            mcc_code="5511",
            currency="CZK",
            account_holder_name=holder_name,
            iban=iban,
            card_present=True,
            scenario_marker="high_value_anomaly",
        )

    if scenario == "fraud_card_not_present":
        return Transaction(
            date=tx_date,
            merchant="ElectroShop-online.ru",
            amount_czk=Decimal("8500.00"),
            mcc_code="5734",
            currency="CZK",
            account_holder_name=holder_name,
            iban=iban,
            card_present=False,
            scenario_marker="fraud_card_not_present",
        )

    return None


# ---------------------------------------------------------------------------
# JSON serialisation helper
# ---------------------------------------------------------------------------

def _tx_to_dict(tx: Transaction) -> dict:
    d = asdict(tx)
    d["date"] = tx.date.isoformat()
    d["amount_czk"] = str(tx.amount_czk)
    return d


# ---------------------------------------------------------------------------
# __main__: generate sample datasets
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    samples_dir = Path(__file__).parent / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    persona_files = [
        (PERSONA_A, "persona_a.json"),
        (PERSONA_B, "persona_b.json"),
        (PERSONA_C, "persona_c.json"),
    ]

    for persona, filename in persona_files:
        txs = generate_transactions(persona, days=90, seed=42)
        out_path = samples_dir / filename
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "persona_id": persona.id,
                    "label_cz": persona.label_cz,
                    "transaction_count": len(txs),
                    "transactions": [_tx_to_dict(t) for t in txs],
                },
                f,
                ensure_ascii=False,
                indent=2,
            )
        scenario_markers = [t.scenario_marker for t in txs if t.scenario_marker]
        print(
            f"Generated {len(txs):>3} transactions for {persona.id} "
            f"-> {out_path}  scenarios={scenario_markers}"
        )
