from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str
    abstract: str
    tags: list[str] | None = None
    university: str | None = None
    department: str | None = None
    project_type: str | None = None
    supervisor_id: UUID | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    abstract: str | None = None
    tags: list[str] | None = None
    university: str | None = None
    department: str | None = None
    project_type: str | None = None
    supervisor_id: UUID | None = None
    status: str | None = None


class ProjectOut(BaseModel):
    id: UUID
    user_id: UUID
    supervisor_id: UUID | None
    title: str
    abstract: str
    tags: list[str] | None
    university: str | None
    department: str | None
    project_type: str | None
    file_url: str | None
    file_key: str | None
    file_size: int | None
    status: str
    views: int
    downloads: int
    avg_rating: float | None = None
    total_ratings: int | None = None
    created_at: datetime
    updated_at: datetime


class ProjectOutDetailed(ProjectOut):
    author_name: str | None = None
    supervisor_name: str | None = None
