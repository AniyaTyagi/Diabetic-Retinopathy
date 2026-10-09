"""Lightweight schema sync for Neon/Postgres (create_all does not ALTER)."""

from sqlalchemy import text

from app.database import engine


_PATIENT_COLUMNS = [
    ("last_screening_date", "VARCHAR(64)"),
    ("latest_dr_level", "INTEGER"),
    ("latest_confidence", "DOUBLE PRECISION"),
    ("queue_status", "VARCHAR(64)"),
    ("thumb_variant", "VARCHAR(64)"),
]

_SCREENING_COLUMNS = [
    ("screening_date", "VARCHAR(64)"),
    ("quality_json", "TEXT"),
    ("explainability_json", "TEXT"),
    ("lesions_json", "TEXT"),
    ("structure_json", "TEXT"),
    ("follow_up_date", "VARCHAR(64)"),
    ("follow_up_center", "VARCHAR(255)"),
    ("follow_up_notes", "TEXT"),
]

_REPORT_COLUMNS = [
    ("screening_id", "VARCHAR(64)"),
]


def _add_columns_pg(conn, table: str, columns: list[tuple[str, str]]) -> None:
    for col, typ in columns:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {typ}"))


def _add_columns_sqlite(conn, table: str, columns: list[tuple[str, str]]) -> None:
    existing = {
        row[1] for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    }
    for col, typ in columns:
        if col not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typ}"))


def ensure_schema() -> None:
    """Create missing tables and add missing columns (Postgres / SQLite)."""
    dialect = engine.dialect.name
    with engine.begin() as conn:
        if dialect == "postgresql":
            _add_columns_pg(conn, "patients", _PATIENT_COLUMNS)
            _add_columns_pg(conn, "screenings", _SCREENING_COLUMNS)
            _add_columns_pg(conn, "reports", _REPORT_COLUMNS)
        elif dialect == "sqlite":
            _add_columns_sqlite(conn, "patients", _PATIENT_COLUMNS)
            _add_columns_sqlite(conn, "screenings", _SCREENING_COLUMNS)
            _add_columns_sqlite(conn, "reports", _REPORT_COLUMNS)
