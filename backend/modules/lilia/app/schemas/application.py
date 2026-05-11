import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ApplicationDecisionStatus = Literal["accepted", "rejected"]


class ApplicationCreate(BaseModel):
    message: str | None = Field(default=None, max_length=10000)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationDecisionStatus


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    opportunity_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    student_avatar: str | None = None
    status: str
    message: str | None = None
    created_at: datetime


class MyApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    opportunity_id: uuid.UUID
    student_id: uuid.UUID
    status: str
    message: str | None = None
    created_at: datetime
    opportunity_title: str
    company_name: str | None = None
