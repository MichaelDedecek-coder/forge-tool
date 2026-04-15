"""Layer 7 — Audit Logger (append-only SQLite)."""

import csv
import io
import json
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class AuditEvent:
    id: int
    timestamp: datetime
    layer: str
    action: str
    persona_id: str | None
    metadata: dict[str, Any]
    risk_classification: str | None = None
    decision_rationale: str | None = None
    data_subject_id: str | None = None
    retention_until: str | None = None


class AuditLogger:
    SCHEMA = """
    CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        layer TEXT NOT NULL,
        action TEXT NOT NULL,
        persona_id TEXT,
        metadata TEXT NOT NULL,
        risk_classification TEXT,
        decision_rationale TEXT,
        data_subject_id TEXT,
        retention_until TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_layer ON audit_events(layer);
    CREATE INDEX IF NOT EXISTS idx_persona ON audit_events(persona_id);
    """

    # Columns added in DORA extension; used for backwards-compatible migration
    _NEW_COLUMNS = [
        ("risk_classification", "TEXT"),
        ("decision_rationale", "TEXT"),
        ("data_subject_id", "TEXT"),
        ("retention_until", "TEXT"),
    ]

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript(self.SCHEMA)
            # Backwards-compatible migration: add new columns if they don't exist
            existing_cols = {
                row[1]
                for row in conn.execute("PRAGMA table_info(audit_events)").fetchall()
            }
            for col_name, col_type in self._NEW_COLUMNS:
                if col_name not in existing_cols:
                    conn.execute(
                        f"ALTER TABLE audit_events ADD COLUMN {col_name} {col_type}"
                    )

    def log_event(
        self,
        layer: str,
        action: str,
        persona_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        risk_classification: str | None = None,
        decision_rationale: str | None = None,
        data_subject_id: str | None = None,
        retention_until: str | None = None,
    ) -> int:
        ts = datetime.now(timezone.utc).isoformat()
        meta_json = json.dumps(metadata or {})
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO audit_events "
                "(timestamp, layer, action, persona_id, metadata, "
                "risk_classification, decision_rationale, data_subject_id, retention_until) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    ts,
                    layer,
                    action,
                    persona_id,
                    meta_json,
                    risk_classification,
                    decision_rationale,
                    data_subject_id,
                    retention_until,
                ),
            )
            return cursor.lastrowid

    def _row_to_event(self, row) -> AuditEvent:
        return AuditEvent(
            id=row[0],
            timestamp=datetime.fromisoformat(row[1]),
            layer=row[2],
            action=row[3],
            persona_id=row[4],
            metadata=json.loads(row[5]),
            risk_classification=row[6] if len(row) > 6 else None,
            decision_rationale=row[7] if len(row) > 7 else None,
            data_subject_id=row[8] if len(row) > 8 else None,
            retention_until=row[9] if len(row) > 9 else None,
        )

    def events_for_layer(self, layer: str) -> list[AuditEvent]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT id, timestamp, layer, action, persona_id, metadata, "
                "risk_classification, decision_rationale, data_subject_id, retention_until "
                "FROM audit_events WHERE layer = ? ORDER BY id ASC",
                (layer,),
            ).fetchall()
        return [self._row_to_event(row) for row in rows]

    def all_events(self) -> list[AuditEvent]:
        """Return all events across all layers, ordered by id."""
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT id, timestamp, layer, action, persona_id, metadata, "
                "risk_classification, decision_rationale, data_subject_id, retention_until "
                "FROM audit_events ORDER BY id ASC"
            ).fetchall()
        return [self._row_to_event(row) for row in rows]

    def events_for_persona(self, persona_id: str) -> list[AuditEvent]:
        """Return all events for a specific persona, ordered by id."""
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT id, timestamp, layer, action, persona_id, metadata, "
                "risk_classification, decision_rationale, data_subject_id, retention_until "
                "FROM audit_events WHERE persona_id = ? ORDER BY id ASC",
                (persona_id,),
            ).fetchall()
        return [self._row_to_event(row) for row in rows]

    def event_count(self) -> int:
        """Total number of events in the log."""
        with sqlite3.connect(self.db_path) as conn:
            return conn.execute("SELECT COUNT(*) FROM audit_events").fetchone()[0]

    def export_csv(self) -> str:
        """Export all events as CSV string for DORA Art. 11 audit query."""
        events = self.all_events()
        output = io.StringIO()
        fieldnames = [
            "id", "timestamp", "layer", "action", "persona_id", "metadata",
            "risk_classification", "decision_rationale", "data_subject_id", "retention_until",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for e in events:
            writer.writerow({
                "id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "layer": e.layer,
                "action": e.action,
                "persona_id": e.persona_id,
                "metadata": json.dumps(e.metadata),
                "risk_classification": e.risk_classification,
                "decision_rationale": e.decision_rationale,
                "data_subject_id": e.data_subject_id,
                "retention_until": e.retention_until,
            })
        return output.getvalue()

    def export_json(self) -> str:
        """Export all events as JSON array string."""
        events = self.all_events()
        records = [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "layer": e.layer,
                "action": e.action,
                "persona_id": e.persona_id,
                "metadata": e.metadata,
                "risk_classification": e.risk_classification,
                "decision_rationale": e.decision_rationale,
                "data_subject_id": e.data_subject_id,
                "retention_until": e.retention_until,
            }
            for e in events
        ]
        return json.dumps(records)

    def delete_event(self, event_id: int):
        raise NotImplementedError("Audit log is append-only (DORA Art. 11)")

    def update_event(self, event_id: int, fields: dict[str, Any]):
        raise NotImplementedError("Audit log is append-only (DORA Art. 11)")
