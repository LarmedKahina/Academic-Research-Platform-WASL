import os
from collections.abc import Generator
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from fastapi import HTTPException, status
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[2]


def load_environment() -> None:
    load_dotenv(BACKEND_DIR / ".env", override=False)
    load_dotenv(ROOT_DIR / ".env", override=False)


load_environment()

Base = declarative_base()
engine: Engine | None = None
SessionLocal: sessionmaker[Session] | None = None


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required")
    return _normalize_database_url(database_url)


def get_engine() -> Engine:
    global engine
    if engine is None:
        engine = create_engine(get_database_url(), pool_pre_ping=True, pool_recycle=300)
    return engine


def get_session_local() -> sessionmaker[Session]:
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
        )
    return SessionLocal


def get_db() -> Generator[Session, None, None]:
    try:
        db = get_session_local()()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        yield db
    finally:
        db.close()


def _normalize_database_url(database_url: str) -> str:
    parsed = urlsplit(database_url)
    if parsed.scheme == "postgres":
        parsed = parsed._replace(scheme="postgresql+psycopg")
    elif parsed.scheme == "postgresql":
        parsed = parsed._replace(scheme="postgresql+psycopg")
    elif parsed.scheme not in {"postgresql+psycopg", "postgresql+psycopg2"}:
        raise RuntimeError(
            "DATABASE_URL must use postgres://, postgresql://, "
            "postgresql+psycopg://, or postgresql+psycopg2://"
        )

    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    hostname = parsed.hostname or ""
    is_localhost = hostname in {"localhost", "127.0.0.1", "::1"}
    if not is_localhost and "sslmode" not in query:
        query["sslmode"] = "require"

    return urlunsplit(parsed._replace(query=urlencode(query)))


__all__ = [
    "Base",
    "SessionLocal",
    "engine",
    "get_database_url",
    "get_db",
    "get_engine",
    "get_session_local",
    "load_environment",
]
