import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityListResponse,
    OpportunityResponse,
)


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    company_name: str | None = None
    industry: str | None = None
    location: str | None = None
    website: str | None = None
    description: str | None = None
    interests: list[str] = []
    total_opportunities: int = 0
    hired_students: int = 0
    active_projects: int = 0
    profile_views: int = 0


class CompanyUpdate(BaseModel):
    company_name: str | None = None
    industry: str | None = None
    location: str | None = None
    website: str | None = None
    description: str | None = None
    interests: list[str] | None = None


class CompanyListResponse(BaseModel):
    companies: list[CompanyResponse]
    total: int
    limit: int
    page: int


class CompanyStats(BaseModel):
    opportunities: int = 0
    applications: int = 0


class CompanyProfileResponse(CompanyResponse):
    stats: CompanyStats | None = None
