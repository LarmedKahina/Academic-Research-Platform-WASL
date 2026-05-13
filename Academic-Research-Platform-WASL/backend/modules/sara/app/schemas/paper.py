from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PaperCreate(BaseModel):
    title: str
    abstract: str | None = None
    tags: list[str] | None = None
    authors: list[str] | None = None
    pages: int | None = None
    citations: int | None = None


class PaperUpdate(BaseModel):
    title: str | None = None
    abstract: str | None = None
    tags: list[str] | None = None
    authors: list[str] | None = None
    pages: int | None = None
    citations: int | None = None


class PaperOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    abstract: str | None
    tags: list[str] | None
    authors: list[str] | None
    file_url: str | None
    file_key: str | None
    pages: int | None
    citations: int | None
    views: int | None
    created_at: datetime
