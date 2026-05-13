from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models import User, StudentProfile, ProfessorProfile, CompanyProfile, Project, Opportunity
from app.responses import ok
from app.services.storage import upload_file_to_bucket
from app.services.user_response import (
    ensure_profile_for_user,
    user_with_profile,
    user_with_profile_minimal_public,
)

router = APIRouter(prefix="/api/users", tags=["users"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


class UserMeUpdate(BaseModel):
    name: str | None = None
    university: str | None = None
    department: str | None = None
    year: str | None = None
    bio: str | None = None
    skills: list[str] | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    title: str | None = None
    research_areas: list[str] | None = None
    company_name: str | None = None
    industry: str | None = None
    location: str | None = None
    website: str | None = None
    description: str | None = None
    interests: list[str] | None = None


def _serialize_project_row(db: Session, p: Project) -> dict[str, Any]:
    auth = db.scalars(select(User).where(User.id == p.user_id)).first()
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "supervisor_id": str(p.supervisor_id) if p.supervisor_id else None,
        "title": p.title,
        "abstract": p.abstract,
        "tags": list(p.tags) if p.tags is not None else None,
        "university": p.university,
        "department": p.department,
        "project_type": p.project_type,
        "file_url": p.file_url,
        "status": p.status,
        "views": p.views or 0,
        "downloads": p.downloads or 0,
        "avg_rating": float(p.avg_rating) if p.avg_rating is not None else None,
        "total_ratings": p.total_ratings or 0,
        "created_at": p.created_at.isoformat(),
        "author_name": auth.name if auth else None,
    }


def _projects_for_profile(
    db: Session,
    profile_user: User,
    viewer: User | None,
) -> list[dict[str, Any]]:
    owner_view = viewer is not None and viewer.id == profile_user.id
    admin_view = viewer is not None and viewer.role == "admin"
    show_all = owner_view or admin_view

    if profile_user.role == "professor":
        stmt = select(Project).where(Project.supervisor_id == profile_user.id)
    else:
        stmt = select(Project).where(Project.user_id == profile_user.id)

    if not show_all:
        stmt = stmt.where(Project.status == "approved")

    stmt = stmt.order_by(Project.created_at.desc())
    rows = db.scalars(stmt).all()
    return [_serialize_project_row(db, r) for r in rows]


@router.get("/me")
def get_me(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    u = db.scalars(select(User).where(User.id == current.id)).one()
    if ensure_profile_for_user(db, u):
        db.commit()
        u = db.scalars(select(User).where(User.id == current.id)).one()
    return ok(user_with_profile(db, u))


@router.put("/me")
def put_me(body: UserMeUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = _now()
    if ensure_profile_for_user(db, current):
        db.flush()
    if body.name:
        current.name = body.name
    current.updated_at = now

    if current.role == "student":
        sp = db.scalars(select(StudentProfile).where(StudentProfile.user_id == current.id)).first()
        if sp:
            for field in (
                "university",
                "department",
                "year",
                "bio",
                "skills",
                "github_url",
                "linkedin_url",
            ):
                val = getattr(body, field)
                if val is not None:
                    setattr(sp, field, val)
    elif current.role == "professor":
        pp = db.scalars(select(ProfessorProfile).where(ProfessorProfile.user_id == current.id)).first()
        if pp:
            if body.university is not None:
                pp.university = body.university
            if body.department is not None:
                pp.department = body.department
            if body.bio is not None:
                pp.bio = body.bio
            if body.title is not None:
                pp.title = body.title
            if body.research_areas is not None:
                pp.research_areas = body.research_areas
    elif current.role == "company":
        cp = db.scalars(select(CompanyProfile).where(CompanyProfile.user_id == current.id)).first()
        if cp:
            if body.company_name is not None:
                cp.company_name = body.company_name
            if body.industry is not None:
                cp.industry = body.industry
            if body.location is not None:
                cp.location = body.location
            if body.website is not None:
                cp.website = body.website
            if body.description is not None:
                cp.description = body.description
            if body.interests is not None:
                cp.interests = body.interests

    db.commit()
    refreshed = db.scalars(select(User).where(User.id == current.id)).one()
    return ok(user_with_profile(db, refreshed))


@router.get("/{user_id}")
def get_public_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    u = db.scalars(select(User).where(User.id == user_id)).first()
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "User not found"}},
        )
    if ensure_profile_for_user(db, u):
        db.commit()
        u = db.scalars(select(User).where(User.id == user_id)).one()
    data = user_with_profile_minimal_public(db, u)
    data["projects"] = _projects_for_profile(db, u, viewer)
    return ok(data)


@router.post("/me/avatar")
async def upload_avatar(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Avatar must be under 10MB"}},
        )
    ct = file.content_type or "application/octet-stream"
    url, _key = upload_file_to_bucket(
        folder_prefix=f"avatars/{current.id}",
        filename=file.filename or "avatar",
        content_type=ct,
        data=raw,
    )
    current.avatar_url = url
    current.updated_at = _now()
    db.commit()
    return ok({"avatar_url": url})


@router.get("/{user_id}/stats")
def user_stats(user_id: uuid.UUID, db: Session = Depends(get_db)):
    u = db.scalars(select(User).where(User.id == user_id)).first()
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "User not found"}},
        )

    stats: dict[str, Any] = {"role": u.role}
    if u.role == "student":
        sp = db.scalars(select(StudentProfile).where(StudentProfile.user_id == u.id)).first()
        if sp:
            stats.update(
                {
                    "global_rank": float(sp.global_rank) if sp.global_rank is not None else None,
                    "total_views": sp.total_views or 0,
                    "total_downloads": sp.total_downloads or 0,
                    "avg_rating": float(sp.avg_rating) if sp.avg_rating is not None else None,
                }
            )
    elif u.role == "professor":
        pp = db.scalars(select(ProfessorProfile).where(ProfessorProfile.user_id == u.id)).first()
        supervised = db.scalar(
            select(func.count())
            .select_from(Project)
            .where(Project.supervisor_id == u.id)
        ) or 0
        if pp:
            stats.update(
                {
                    "total_supervised": supervised or (pp.total_supervised or 0),
                    "avg_project_rating": float(pp.avg_project_rating)
                    if pp.avg_project_rating is not None
                    else None,
                }
            )
        else:
            stats["total_supervised"] = supervised
    elif u.role == "company":
        cp = db.scalars(select(CompanyProfile).where(CompanyProfile.user_id == u.id)).first()
        open_cnt = db.scalar(
            select(func.count())
            .select_from(Opportunity)
            .where(
                Opportunity.company_id == u.id,
                or_(Opportunity.status == "open", Opportunity.status.is_(None)),
            )
        ) or 0
        total_opp = db.scalar(
            select(func.count()).select_from(Opportunity).where(Opportunity.company_id == u.id)
        ) or 0
        stats["total_opportunities"] = (cp.total_opportunities if cp and cp.total_opportunities else total_opp)
        stats["open_opportunities"] = open_cnt

    return ok(stats)
