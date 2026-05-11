import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SavedProjectProject(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    avg_rating: float | None = None
    total_ratings: int | None = None
    created_at: datetime | None = None


class SavedProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime | None = None
    project: SavedProjectProject | None = None


class SavedProjectListResponse(BaseModel):
    saved_projects: list[SavedProjectResponse]
    total: int
    limit: int
    page: int
