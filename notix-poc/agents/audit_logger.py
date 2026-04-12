"""Layer 7 — Audit Logger (append-only SQLite)."""

import json
import sqlite3
from dataclasses import dataclass
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


class AuditLogger:
    SCHEMA = """
    CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        layer TEXT NOT NULL,
        action TEXT NOT NULL,
        persona_id TEXT,
        metadata TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_layer ON audit_events(layer);
    CREATE INDEX IF NOT EXISTS idx_persona ON audit_events(persona_id);
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript(self.SCHEMA)

    def log_event(self, layer: str, action: str, persona_id: str | None = None,
                  metadata: dict[str, Any] | None = None) -> int:
        ts = datetime.now(timezone.utc).isoformat()
        meta_json = json.dumps(metadata or {})
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO audit_events (timestamp, layer, action, persona_id, metadata) "
                "VALUES (?, ?, ?, ?, ?)",
                (ts, layer, action, persona_id, meta_json),
            )
            return cursor.lastrowid

    def events_for_layer(self, layer: str) -> list[AuditEvent]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT id, timestamp, layer, action, persona_id, metadata "
                "FROM audit_events WHERE layer = ? ORDER BY id ASC",
                (layer,),
            ).fetchall()
        return [
            AuditEvent(
                id=row[0],
                timestamp=datetime.fromisoformat(row[1]),
                layer=row[2],
                action=row[3],
                persona_id=row[4],
                metadata=json.loads(row[5]),
            )
            for row in rows
        ]

    def delete_event(self, event_id: int):
        raise NotImplementedError("Audit log is append-only (DORA Art. 11)")

    def update_event(self, event_id: int, fields: dict[str, Any]):
        raise NotImplementedError("Audit log is append-only (DORA Art. 11)")
