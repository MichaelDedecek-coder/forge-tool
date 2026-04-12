"""Synthetic Czech Spořitelna customer personas for NOTIX POC.

Each persona has a deterministic spending fingerprint used by the
transaction generator (data/transaction_generator.py).
"""

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class Persona:
    id: str
    label_cz: str
    age: int
    city: str
    monthly_income_czk: Decimal
    monthly_recurring_categories: dict[str, Decimal] = field(default_factory=dict)
    discretionary_categories: list[str] = field(default_factory=list)
    triggered_scenarios: list[str] = field(default_factory=list)


PERSONA_A = Persona(
    id="persona-a",
    label_cz="Mladý profesionál",
    age=28,
    city="Praha",
    monthly_income_czk=Decimal("60000"),
    monthly_recurring_categories={
        "Bydlení": Decimal("18000"),
        "Předplatné": Decimal("1500"),
        "Doprava (MHD)": Decimal("550"),
    },
    discretionary_categories=["Restaurace", "Cestování", "Elektronika", "Sport"],
    triggered_scenarios=["investment_recommendation"],
)

PERSONA_B = Persona(
    id="persona-b",
    label_cz="Rodina s dětmi",
    age=38,
    city="Brno",
    monthly_income_czk=Decimal("110000"),
    monthly_recurring_categories={
        "Hypotéka": Decimal("28000"),
        "Energie": Decimal("4500"),
        "Děti (školka, kroužky)": Decimal("8000"),
        "Auto (leasing + pojištění)": Decimal("12000"),
    },
    discretionary_categories=["Potraviny", "Drogerie", "Dovolená", "Domácnost"],
    triggered_scenarios=["high_value_anomaly"],
)

PERSONA_C = Persona(
    id="persona-c",
    label_cz="Senior",
    age=67,
    city="Nový Bor",
    monthly_income_czk=Decimal("25000"),
    monthly_recurring_categories={
        "Energie": Decimal("3200"),
        "Léky a zdravotnictví": Decimal("1800"),
    },
    discretionary_categories=["Potraviny", "Dárky", "Drobné nákupy"],
    triggered_scenarios=["fraud_card_not_present"],
)

ALL_PERSONAS = [PERSONA_A, PERSONA_B, PERSONA_C]
