from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenUserOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    verified: bool
    avatar_url: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: TokenUserOut


class MeResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    verified: bool
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
