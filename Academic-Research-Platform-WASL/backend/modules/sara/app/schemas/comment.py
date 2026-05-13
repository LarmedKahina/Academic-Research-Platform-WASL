from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    user_name: str | None = None
    content: str
    created_at: datetime
    updated_at: datetime
