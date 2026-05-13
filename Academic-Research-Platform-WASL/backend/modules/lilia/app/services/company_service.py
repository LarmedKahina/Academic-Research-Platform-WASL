import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.opportunity import Opportunity
from app.models.user import User


def list_companies(
    db: Session,
    industry: str | None = None,
    location: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict[str, object]:
    filters = [User.role == "company"]
    if industry:
        filters.append(User.industry.ilike(f"%{industry}%"))
    if location:
        filters.append(User.location.ilike(f"%{location}%"))

    total = db.scalar(select(func.count(User.id)).where(*filters)) or 0
    companies = db.scalars(
        select(User)
        .where(*filters)
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "companies": companies,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_company_profile(db: Session, company_id: uuid.UUID) -> dict[str, object]:
    company = _get_company(db, company_id)

    opportunities_count = db.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.company_id == company_id)
    ) or 0
    applications_count = db.scalar(
        select(func.count(Application.id))
        .join(Opportunity, Application.opportunity_id == Opportunity.id)
        .where(Opportunity.company_id == company_id)
    ) or 0

    return {
        **_serialize_company(company),
        "stats": {
            "opportunities": opportunities_count,
            "applications": applications_count,
        },
    }


def get_company_opportunities(
    db: Session,
    company_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> dict[str, object]:
    _get_company(db, company_id)

    total = db.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.company_id == company_id)
    ) or 0
    opportunities = db.scalars(
        select(Opportunity)
        .where(Opportunity.company_id == company_id)
        .order_by(Opportunity.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "opportunities": opportunities,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def create_opportunity(
    db: Session,
    company_id: uuid.UUID,
    current_user_id: uuid.UUID,
    current_user_role: str,
    title: str,
    description: str,
    type: str | None = None,
    skills: list[str] | None = None,
    location: str | None = None,
    deadline=None,
    status_value: str = "open",
) -> Opportunity:
    if current_user_role != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company users can create opportunities",
        )
    if current_user_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company users can only create opportunities for their own profile",
        )

    _get_company(db, company_id)

    opportunity = Opportunity(
        company_id=company_id,
        title=title,
        description=description,
        type=type,
        skills=skills,
        location=location,
        deadline=deadline,
        status=status_value,
    )
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return opportunity


def _get_company(db: Session, company_id: uuid.UUID) -> User:
    company = db.scalar(
        select(User).where(
            User.id == company_id,
            User.role == "company",
        )
    )
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return company


def _serialize_company(company: User) -> dict[str, object]:
    return {
        "id": company.id,
        "email": company.email,
        "full_name": company.full_name,
        "avatar_url": company.avatar_url,
        "industry": company.industry,
        "location": company.location,
        "website": company.website,
        "description": company.description,
        "created_at": company.created_at,
    }
