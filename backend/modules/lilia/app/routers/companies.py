import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models.company import CompanyProfile
from app.schemas.company import CompanyListResponse, CompanyResponse, CompanyUpdate

router = APIRouter()


@router.get("/companies", response_model=CompanyListResponse)
def list_companies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    industry: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    filters = []
    if industry:
        filters.append(CompanyProfile.industry.ilike(f"%{industry}%"))

    offset = (page - 1) * limit
    total = db.scalar(select(func.count(CompanyProfile.user_id)).where(*filters)) or 0
    companies = db.scalars(
        select(CompanyProfile)
        .where(*filters)
        .order_by(CompanyProfile.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "companies": [_serialize_company(company) for company in companies],
        "total": total,
        "limit": limit,
        "page": page,
    }


@router.get("/companies/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    company = _get_company(db, company_id)
    company.profile_views = (company.profile_views or 0) + 1
    db.commit()
    db.refresh(company)
    return _serialize_company(company)


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: uuid.UUID,
    payload: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    if current_user.role != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company accounts can update company profiles",
        )

    if current_user.id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company users can only update their own profile",
        )

    company = _get_company(db, company_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    company.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(company)
    return _serialize_company(company)


def _get_company(db: Session, company_id: uuid.UUID) -> CompanyProfile:
    company = db.get(CompanyProfile, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found",
        )
    return company


def _serialize_company(company: CompanyProfile) -> dict[str, object]:
    return {
        "user_id": company.user_id,
        "company_name": company.company_name,
        "industry": company.industry,
        "location": company.location,
        "website": company.website,
        "description": company.description,
        "interests": company.interests or [],
        "total_opportunities": company.total_opportunities or 0,
        "hired_students": company.hired_students or 0,
        "active_projects": company.active_projects or 0,
        "profile_views": company.profile_views or 0,
    }
