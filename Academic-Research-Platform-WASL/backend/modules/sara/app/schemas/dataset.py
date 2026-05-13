from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DatasetCreate(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    format: str | None = None


class DatasetUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    format: str | None = None


class DatasetOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str | None
    category: str | None
    tags: list[str] | None
    file_url: str | None
    file_key: str | None
    file_size: int | None
    format: str | None
    downloads: int
    created_at: datetime
