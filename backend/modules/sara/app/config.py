import os
from typing import Any

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _env_any(*names: str) -> str | None:
    for n in names:
        v = os.environ.get(n)
        if v:
            return v
    low = {k.lower(): v for k, v in os.environ.items()}
    for n in names:
        v = low.get(n.lower())
        if v:
            return v
    return None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    database_url: str
    secret_key: str
    supabase_url: str
    supabase_service_key: str
    supabase_storage_bucket: str = "wasldz-files"
    # Optional override if DATABASE_URL uses pooler but SUPABASE_URL is missing / wrong
    supabase_project_ref: str | None = None
    environment: str = "development"

    @model_validator(mode="before")
    @classmethod
    def _normalize_supabase_env(cls, data: Any) -> Any:
        """Accept SUPABASE_URL and SUPABASE_SERVICE_ROLE from Supabase alongside legacy names."""
        d = dict(data) if isinstance(data, dict) else {}

        def _from_data(*keys: str) -> str | None:
            for k in keys:
                v = d.get(k)
                if v and str(v).strip():
                    return str(v).strip()
            return None

        if not (d.get("supabase_url") or "").strip():
            u = _from_data("SUPABASE_URL", "supabase_url") or _env_any("SUPABASE_URL", "supabase_url")
            if u:
                d["supabase_url"] = u.rstrip("/")
        if not (d.get("supabase_service_key") or "").strip():
            k = (
                _from_data("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE", "supabase_service_key")
                or _env_any("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE", "supabase_service_key")
            )
            if k:
                d["supabase_service_key"] = k
        return d


settings = Settings()
