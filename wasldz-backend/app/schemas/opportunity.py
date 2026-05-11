from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class OpportunityCreate(BaseModel):
    title: str
    description: str | None = None
    type: str | None = None
    skills: list[str] | None = None
    status: str | None = "open"
    deadline: date | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    skills: list[str] | None = None
    status: str | None = None
    deadline: date | None = None


class OpportunityOut(BaseModel):
    id: UUID
    company_id: UUID
    title: str
    description: str | None
    type: str | None
    skills: list[str] | None
    status: str | None
    deadline: date | None
    created_at: datetime


class ApplicationCreate(BaseModel):
    message: str | None = None


class ApplicationOut(BaseModel):
    id: UUID
    opportunity_id: UUID
    student_id: UUID
    student_name: str | None = None
    status: str
    message: str | None = None
    created_at: datetime


class ApplicationStatusUpdate(BaseModel):
    status: str
