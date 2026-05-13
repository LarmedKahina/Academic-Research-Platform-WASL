import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.company import (
    CompanyListResponse,
    CompanyProfileResponse,
    OpportunityCreate,
    OpportunityListResponse,
    OpportunityResponse,
)
from app.services import company_service

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=CompanyListResponse)
def list_companies(
    industry: str | None = Query(default=None),
    location: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return company_service.list_companies(
        db=db,
        industry=industry,
        location=location,
        limit=limit,
        offset=offset,
    )


@router.get("/companies/{company_id}", response_model=CompanyProfileResponse)
def get_company_profile(
    company_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return company_service.get_company_profile(db=db, company_id=company_id)


@router.get("/companies/{company_id}/opportunities", response_model=OpportunityListResponse)
def get_company_opportunities(
    company_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return company_service.get_company_opportunities(
        db=db,
        company_id=company_id,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/companies/{company_id}/opportunities",
    response_model=OpportunityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_company_opportunity(
    company_id: uuid.UUID,
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> object:
    return company_service.create_opportunity(
        db=db,
        company_id=company_id,
        current_user_id=current_user.id,
        current_user_role=current_user.role,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        skills=payload.skills,
        location=payload.location,
        deadline=payload.deadline,
        status_value="open",
    )
