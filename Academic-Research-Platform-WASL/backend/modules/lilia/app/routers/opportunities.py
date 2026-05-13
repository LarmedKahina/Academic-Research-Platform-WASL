import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models.company import CompanyProfile
from app.models.opportunity import Opportunity
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityListResponse,
    OpportunityResponse,
    OpportunityUpdate,
)

router = APIRouter()


@router.get("/opportunities", response_model=OpportunityListResponse)
def list_opportunities(
    type: str | None = Query(default=None),
    skills: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    filters = [Opportunity.status == "open"]
    if type:
        filters.append(Opportunity.type == type)
    if skills:
        filters.append(Opportunity.skills.any(skills))

    offset = (page - 1) * limit
    total = db.scalar(select(func.count(Opportunity.id)).where(*filters)) or 0
    rows = db.execute(
        select(Opportunity, CompanyProfile.company_name)
        .join(CompanyProfile, CompanyProfile.user_id == Opportunity.company_id, isouter=True)
        .where(*filters)
        .order_by(Opportunity.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "opportunities": [
            _serialize_opportunity(opportunity, company_name)
            for opportunity, company_name in rows
        ],
        "total": total,
        "limit": limit,
        "page": page,
    }


@router.get(
    "/companies/{company_id}/opportunities",
    response_model=OpportunityListResponse,
)
def get_company_opportunities(
    company_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    offset = (page - 1) * limit
    total = db.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.company_id == company_id)
    ) or 0
    rows = db.execute(
        select(Opportunity, CompanyProfile.company_name)
        .join(CompanyProfile, CompanyProfile.user_id == Opportunity.company_id, isouter=True)
        .where(Opportunity.company_id == company_id)
        .order_by(Opportunity.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "opportunities": [
            _serialize_opportunity(opportunity, company_name)
            for opportunity, company_name in rows
        ],
        "total": total,
        "limit": limit,
        "page": page,
    }


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
def get_opportunity(
    opportunity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    opportunity, company_name = _get_opportunity_with_company(db, opportunity_id)
    return _serialize_opportunity(opportunity, company_name)


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
) -> dict[str, object]:
    _ensure_company_owner(current_user, company_id)
    company = _get_company(db, company_id)

    opportunity = Opportunity(
        company_id=company_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        skills=payload.skills,
        location=payload.location,
        deadline=payload.deadline,
        status="open",
    )
    company.total_opportunities = (company.total_opportunities or 0) + 1
    company.updated_at = datetime.utcnow()
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return _serialize_opportunity(opportunity, company.company_name)


@router.put("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
def update_opportunity(
    opportunity_id: uuid.UUID,
    payload: OpportunityUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    opportunity, company_name = _get_opportunity_with_company(db, opportunity_id)
    _ensure_company_owner(current_user, opportunity.company_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(opportunity, field, value)
    opportunity.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(opportunity)
    return _serialize_opportunity(opportunity, company_name)


@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    opportunity = db.get(Opportunity, opportunity_id)
    if opportunity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    _ensure_company_owner(current_user, opportunity.company_id)

    company = db.get(CompanyProfile, opportunity.company_id)
    if company is not None and (company.total_opportunities or 0) > 0:
        company.total_opportunities -= 1
        company.updated_at = datetime.utcnow()

    db.delete(opportunity)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/opportunities", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_current_company_opportunity(
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return create_company_opportunity(
        company_id=current_user.id,
        payload=payload,
        db=db,
        current_user=current_user,
    )


def _get_company(db: Session, company_id: uuid.UUID) -> CompanyProfile:
    company = db.get(CompanyProfile, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found",
        )
    return company


def _get_opportunity_with_company(
    db: Session,
    opportunity_id: uuid.UUID,
) -> tuple[Opportunity, str | None]:
    row = db.execute(
        select(Opportunity, CompanyProfile.company_name)
        .join(CompanyProfile, CompanyProfile.user_id == Opportunity.company_id, isouter=True)
        .where(Opportunity.id == opportunity_id)
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    return row[0], row[1]


def _ensure_company_owner(current_user: CurrentUser, company_id: uuid.UUID) -> None:
    if current_user.role != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company users can manage opportunities",
        )
    if current_user.id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company users can only manage their own opportunities",
        )


def _serialize_opportunity(
    opportunity: Opportunity,
    company_name: str | None,
) -> dict[str, object]:
    return {
        "id": opportunity.id,
        "company_id": opportunity.company_id,
        "company_name": company_name,
        "title": opportunity.title,
        "description": opportunity.description,
        "type": opportunity.type,
        "skills": opportunity.skills or [],
        "location": opportunity.location,
        "status": opportunity.status,
        "deadline": opportunity.deadline,
        "created_at": opportunity.created_at,
    }
