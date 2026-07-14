"""Database engine, session, and declarative base.

Defaults to SQLite for zero-setup local dev; set DATABASE_URL to a
`postgresql+psycopg://...` URL for production. Code is engine-agnostic.
"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=not _is_sqlite,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. For real deployments prefer Alembic migrations."""
    # Import models so they register on the metadata before create_all.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _auto_add_missing_columns()


def _auto_add_missing_columns() -> None:
    """Dev convenience: add newly-introduced columns to existing tables without a
    full migration tool. Idempotent. Production should use Alembic instead."""
    from sqlalchemy import inspect, text

    # (table, column, DDL type) tuples added after the initial schema.
    additions = [
        ("users", "full_name", "VARCHAR(120)"),
        ("users", "role", "VARCHAR(20) DEFAULT 'patient'"),
        ("users", "plan", "VARCHAR(20) DEFAULT 'free'"),
        ("users", "plan_status", "VARCHAR(20) DEFAULT 'active'"),
        ("users", "trial_ends_at", "DATETIME"),
        ("users", "billing_cycle", "VARCHAR(10)"),
        ("profiles", "phone", "VARCHAR(40)"),
        ("profiles", "country", "VARCHAR(60)"),
        ("profiles", "date_of_birth", "VARCHAR(20)"),
    ]
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, column, ddl_type in additions:
            if table not in existing_tables:
                continue
            cols = {c["name"] for c in inspector.get_columns(table)}
            if column not in cols:
                conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {ddl_type}'))
