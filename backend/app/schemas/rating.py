import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class RatingUpdate(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    rating: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RatingUser(BaseModel):
    id: uuid.UUID
    name: str | None = None


class RatingWithUserResponse(RatingResponse):
    user: RatingUser | None = None


class RatingListResponse(BaseModel):
    ratings: list[RatingWithUserResponse]
    avg_rating: float
    total_ratings: int
