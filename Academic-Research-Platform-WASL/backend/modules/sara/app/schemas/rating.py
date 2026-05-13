from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class RatingOut(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    user_name: str | None = None
    rating: int
    created_at: datetime
