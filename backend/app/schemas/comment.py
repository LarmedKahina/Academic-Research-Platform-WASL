import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentUser(BaseModel):
    id: uuid.UUID
    name: str | None = None
    email: str | None = None
    avatar_url: str | None = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    user_name: str | None = None
    user_avatar: str | None = None
    user: CommentUser | None = None


class CommentListResponse(BaseModel):
    comments: list[CommentResponse]
    total: int
    limit: int
    offset: int
