"""Durable global model budget. Initialization is explicit and never resets usage."""

import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

import psycopg

from .config import Settings


class BudgetExceeded(Exception):
    pass


class Ledger:
    def __init__(self, connection, postgres: bool):
        self.connection, self.postgres = connection, postgres

    def execute(self, query, parameters=()):
        return self.connection.execute(query.replace("?", "%s") if self.postgres else query, parameters)


def configured(settings: Settings) -> bool:
    postgres = settings.ai_budget_database_url.get_secret_value()
    if postgres and settings.ai_budget_path:
        return False  # Never switch to a fresh ledger on an ambiguous configuration.
    return bool(
        postgres.startswith(("postgresql://", "postgres://"))
        or (settings.ai_budget_path and Path(settings.ai_budget_path).is_file())
    )


@contextmanager
def connect(settings: Settings, *, reserve_lock: bool = False):
    if not configured(settings):
        raise BudgetExceeded("Exactly one initialized durable usage ledger is required.")
    postgres = settings.ai_budget_database_url.get_secret_value()
    if postgres:
        # Fully validate TLS using libpq's system roots; never downgrade to plaintext.
        with psycopg.connect(postgres, connect_timeout=5, sslmode="verify-full", sslrootcert="system") as db:
            db.execute("SET LOCAL search_path TO tickerbrief_ai")
            db.execute("SET LOCAL statement_timeout = '5s'")
            if reserve_lock:
                db.execute("LOCK TABLE requests IN EXCLUSIVE MODE")
            yield Ledger(db, True)
    else:
        path = Path(settings.ai_budget_path)
        # mode=rw refuses to create a missing/reset database.
        db = sqlite3.connect(f"{path.resolve().as_uri()}?mode=rw", uri=True, timeout=5)
        try:
            with db:
                if reserve_lock:
                    db.execute("BEGIN IMMEDIATE")
                yield Ledger(db, False)
        finally:
            db.close()


def initialize_budget(path: Path) -> None:
    if path.exists():
        raise ValueError("Budget already exists; refusing to reset global usage.")
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    try:
        with db:
            db.execute("CREATE TABLE requests (timestamp REAL NOT NULL)")
            db.execute("CREATE TABLE results (fingerprint TEXT PRIMARY KEY, content TEXT NOT NULL)")
    finally:
        db.close()


def initialize_postgres(settings: Settings) -> None:
    url = settings.ai_budget_database_url.get_secret_value()
    if not url.startswith(("postgresql://", "postgres://")) or settings.ai_budget_path:
        raise ValueError("Set only AI_BUDGET_DATABASE_URL for PostgreSQL initialization.")
    with psycopg.connect(url, connect_timeout=5, sslmode="verify-full", sslrootcert="system") as db:
        # Existing schema raises an error; no IF NOT EXISTS or destructive reset.
        db.execute("CREATE SCHEMA tickerbrief_ai")
        db.execute("CREATE TABLE tickerbrief_ai.requests (timestamp DOUBLE PRECISION NOT NULL)")
        db.execute(
            "CREATE TABLE tickerbrief_ai.results (fingerprint TEXT PRIMARY KEY, content TEXT NOT NULL)"
        )


def reserve(settings: Settings, now: float | None = None) -> None:
    now = time.time() if now is None else now
    with connect(settings, reserve_lock=True) as db:
        total, daily, minute = db.execute(
            "SELECT COUNT(*), COALESCE(SUM(CASE WHEN timestamp > ? THEN 1 ELSE 0 END),0), "
            "COALESCE(SUM(CASE WHEN timestamp > ? THEN 1 ELSE 0 END),0) FROM requests",
            (now - 86400, now - 60),
        ).fetchone()
        if total >= settings.ai_total_cap or daily >= settings.ai_daily_cap or minute >= settings.ai_rpm:
            raise BudgetExceeded("Interpretation usage cap reached. Facts are still available.")
        db.execute("INSERT INTO requests VALUES (?)", (now,))


def cached_result(settings: Settings, fingerprint: str) -> str | None:
    with connect(settings) as db:
        row = db.execute("SELECT content FROM results WHERE fingerprint=?", (fingerprint,)).fetchone()
        return row[0] if row else None


def save_result(settings: Settings, fingerprint: str, content: str) -> None:
    with connect(settings) as db:
        db.execute(
            "INSERT INTO results VALUES (?,?) ON CONFLICT(fingerprint) DO UPDATE SET content=excluded.content",
            (fingerprint, content),
        )
