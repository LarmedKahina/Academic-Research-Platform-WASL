import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

OpportunityType = Literal["internship", "pfe", "collaboration"]


class OpportunityCreate(BaseModel):
    title: str
    description: str | None = None
    type: OpportunityType
    skills: list[str] = []
    location: str | None = None
    deadline: date | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: OpportunityType | None = None
    skills: list[str] | None = None
    location: str | None = None
    deadline: date | None = None
    status: str | None = None


class OpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    company_name: str | None = None
    title: str
    description: str | None = None
    type: str
    skills: list[str] = []
    location: str | None = None
    status: str
    deadline: date | None = None
    created_at: datetime | None = None


class OpportunityListResponse(BaseModel):
    opportunities: list[OpportunityResponse]
    total: int
    limit: int
    page: int
