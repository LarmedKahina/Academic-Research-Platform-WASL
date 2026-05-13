import re
from urllib.parse import quote, urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _project_ref_from_supabase_url(supabase_url: str) -> str | None:
    """Extract project ref from https://<ref>.supabase.co"""
    if not supabase_url:
        return None
    m = re.search(r"https?://([^./]+)\.supabase\.co", supabase_url.strip(), re.I)
    if m:
        return m.group(1).lower()
    return None


def normalize_supabase_database_url(
    database_url: str,
    supabase_url: str,
    project_ref_override: str | None = None,
) -> str:
    """
    Supabase *shared pooler* (host ...pooler.supabase.com) expects username
    `postgres.<project-ref>` when the client uses plain `postgres`, or routing can fail
    ("Tenant or user not found"). Applies to session (5432) and transaction (6543) hosts.
    """
    p = urlparse(database_url)
    host = (p.hostname or "").lower()
    if "pooler.supabase.com" not in host:
        return database_url
    user = (p.username or "").lower()
    if user.startswith("postgres.") and len(user) > len("postgres."):
        return database_url
    if user and user != "postgres":
        return database_url
    ref = _project_ref_from_supabase_url(supabase_url)
    if not ref and (project_ref_override or "").strip():
        ref = project_ref_override.strip().lower()
    if not ref:
        return database_url
    new_user = f"postgres.{ref}"
    pw = p.password or ""
    userinfo = f"{quote(new_user, safe='')}:{quote(pw, safe='')}"
    netloc = f"{userinfo}@{p.hostname}"
    if p.port:
        netloc += f":{p.port}"
    return urlunparse((p.scheme, netloc, p.path, p.params, p.query, p.fragment))


def _connect_args(database_url: str) -> dict:
    url = database_url.lower()
    if "sslmode=" in url:
        return {}
    return {"sslmode": "require"}


_effective_url = normalize_supabase_database_url(
    settings.database_url,
    settings.supabase_url,
    getattr(settings, "supabase_project_ref", None),
)

engine = create_engine(
    _effective_url,
    pool_pre_ping=True,
    connect_args=_connect_args(_effective_url),
)


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
