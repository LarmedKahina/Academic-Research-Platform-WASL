from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, Opportunity, CompanyProfile, OpportunityApplication
from app.responses import ok
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, ApplicationCreate
from app.services.notify import notify

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


def _now():
    return datetime.now(timezone.utc)


def _company_mini(db: Session, company_id: uuid.UUID) -> dict:
    u = db.scalars(select(User).where(User.id == company_id)).first()
    cp = db.scalars(select(CompanyProfile).where(CompanyProfile.user_id == company_id)).first()
    return {
        "id": str(company_id),
        "name": u.name if u else None,
        "avatar_url": u.avatar_url if u else None,
        "company_name": cp.company_name if cp else None,
        "industry": cp.industry if cp else None,
        "location": cp.location if cp else None,
        "website": cp.website if cp else None,
    }


def _serialize_opp(db: Session, o: Opportunity, with_company: bool = False) -> dict:
    out: dict = {
        "id": str(o.id),
        "company_id": str(o.company_id),
        "title": o.title,
        "description": o.description,
        "type": o.type,
        "skills": list(o.skills) if o.skills else None,
        "status": o.status,
        "deadline": o.deadline.isoformat() if o.deadline else None,
        "created_at": o.created_at.isoformat(),
        "updated_at": o.updated_at.isoformat() if o.updated_at else None,
    }
    if with_company:
        out["company"] = _company_mini(db, o.company_id)
        ac = (
            db.scalar(
                select(func.count())
                .select_from(OpportunityApplication)
                .where(OpportunityApplication.opportunity_id == o.id)
            )
            or 0
        )
        out["applicant_count"] = ac
    return out


def _serialize_app(db: Session, a: OpportunityApplication) -> dict:
    st = db.scalars(select(User).where(User.id == a.student_id)).first()
    return {
        "id": str(a.id),
        "opportunity_id": str(a.opportunity_id),
        "student_id": str(a.student_id),
        "student_name": st.name if st else None,
        "student_avatar_url": st.avatar_url if st else None,
        "status": a.status,
        "message": a.message,
        "created_at": a.created_at.isoformat(),
    }


def _skill_match(row_skills: list[str] | None, needed: list[str]) -> bool:
    if not needed:
        return True
    if not row_skills:
        return False
    rs_lower = [s.lower() for s in row_skills]
    for n in needed:
        nl = n.lower()
        if any(nl == x or nl in x for x in rs_lower):
            return True
    return False


@router.get("")
def list_opportunities(
    db: Session = Depends(get_db),
    opp_type: str | None = Query(None, alias="type"),
    skills: str | None = Query(None, description="Comma-separated; opportunity must match any"),
    open_only: bool = Query(True),
):
    stmt = select(Opportunity).order_by(Opportunity.created_at.desc())
    if open_only:
        stmt = stmt.where(or_(Opportunity.status == "open", Opportunity.status.is_(None)))
    if opp_type:
        stmt = stmt.where(Opportunity.type == opp_type)
    rows = db.scalars(stmt).all()
    skill_list = [s.strip() for s in skills.split(",") if s.strip()] if skills else []
    out = []
    for r in rows:
        if skill_list and not _skill_match(list(r.skills or []), skill_list):
            continue
        out.append(_serialize_opp(db, r, with_company=True))
    return ok(out)


@router.get("/{opportunity_id}")
def get_opportunity(opportunity_id: uuid.UUID, db: Session = Depends(get_db)):
    o = db.scalars(select(Opportunity).where(Opportunity.id == opportunity_id)).first()
    if not o:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Opportunity not found"}},
        )
    data = _serialize_opp(db, o, with_company=True)
    cp = db.scalars(select(CompanyProfile).where(CompanyProfile.user_id == o.company_id)).first()
    data["company_profile"] = (
        {
            "company_name": cp.company_name,
            "industry": cp.industry,
            "location": cp.location,
            "website": cp.website,
            "description": cp.description,
            "interests": list(cp.interests) if cp and cp.interests else None,
        }
        if cp
        else None
    )
    return ok(data)


@router.post("")
def create_opportunity(
    body: OpportunityCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Only companies can publish opportunities"}},
        )
    now = _now()
    o = Opportunity(
        id=uuid.uuid4(),
        company_id=current.id,
        title=body.title,
        description=body.description,
        type=body.type,
        skills=body.skills,
        status=body.status or "open",
        deadline=body.deadline,
        created_at=now,
        updated_at=now,
    )
    db.add(o)
    cp = db.scalars(select(CompanyProfile).where(CompanyProfile.user_id == current.id)).first()
    if cp:
        cp.total_opportunities = (cp.total_opportunities or 0) + 1
    db.commit()
    saved = db.scalars(select(Opportunity).where(Opportunity.id == o.id)).one()
    return ok(_serialize_opp(db, saved, with_company=True))


@router.put("/{opportunity_id}")
def update_opportunity(
    opportunity_id: uuid.UUID,
    body: OpportunityUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    o = db.scalars(select(Opportunity).where(Opportunity.id == opportunity_id)).first()
    if not o:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Opportunity not found"}},
        )
    if o.company_id != current.id and current.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(o, k, v)
    o.updated_at = _now()
    db.commit()
    saved = db.scalars(select(Opportunity).where(Opportunity.id == opportunity_id)).one()
    return ok(_serialize_opp(db, saved, with_company=True))


@router.get("/{opportunity_id}/applications")
def list_applications(
    opportunity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    o = db.scalars(select(Opportunity).where(Opportunity.id == opportunity_id)).first()
    if not o:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Opportunity not found"}},
        )
    if o.company_id != current.id and current.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )
    rows = db.scalars(
        select(OpportunityApplication)
        .where(OpportunityApplication.opportunity_id == opportunity_id)
        .order_by(OpportunityApplication.created_at.desc())
    ).all()
    return ok([_serialize_app(db, r) for r in rows])


@router.post("/{opportunity_id}/apply")
def apply_opportunity(
    opportunity_id: uuid.UUID,
    body: ApplicationCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Only students can apply"}},
        )
    o = db.scalars(select(Opportunity).where(Opportunity.id == opportunity_id)).first()
    if not o:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Opportunity not found"}},
        )

    effective_status = o.status or "open"
    if effective_status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Opportunity is not accepting applications"}},
        )

    dup = db.scalars(
        select(OpportunityApplication).where(
            OpportunityApplication.opportunity_id == opportunity_id,
            OpportunityApplication.student_id == current.id,
        )
    ).first()
    now = _now()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"message": "You already applied to this opportunity"}},
        )

    a = OpportunityApplication(
        id=uuid.uuid4(),
        opportunity_id=opportunity_id,
        student_id=current.id,
        status="pending",
        message=body.message,
        created_at=now,
    )
    db.add(a)

    notify(
        db,
        user_id=o.company_id,
        notif_type="opportunity_application",
        content=(
            f'{current.name} applied to "{o.title}".'
            if current.name
            else f'A student applied to "{o.title}".'
        ),
        link=f"/opportunities/{opportunity_id}",
    )

    db.commit()
    row = db.scalars(select(OpportunityApplication).where(OpportunityApplication.id == a.id)).one()
    return ok(_serialize_app(db, row))
