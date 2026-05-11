"""Build API user payloads with role-specific profiles."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User, StudentProfile, ProfessorProfile, CompanyProfile


def user_base_dict(u: User) -> dict[str, Any]:
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "verified": bool(u.verified),
        "avatar_url": u.avatar_url,
    }


def profile_dict(db: Session, u: User) -> dict[str, Any] | None:
    if u.role == "student":
        sp = db.scalars(select(StudentProfile).where(StudentProfile.user_id == u.id)).first()
        if not sp:
            return None
        return {
            "university": sp.university,
            "department": sp.department,
            "year": sp.year,
            "bio": sp.bio,
            "skills": list(sp.skills) if sp.skills is not None else None,
            "github_url": sp.github_url,
            "linkedin_url": sp.linkedin_url,
            "global_rank": float(sp.global_rank) if sp.global_rank is not None else None,
            "total_views": sp.total_views or 0,
            "total_downloads": sp.total_downloads or 0,
            "avg_rating": float(sp.avg_rating) if sp.avg_rating is not None else None,
        }
    if u.role == "professor":
        pp = db.scalars(select(ProfessorProfile).where(ProfessorProfile.user_id == u.id)).first()
        if not pp:
            return None
        return {
            "university": pp.university,
            "department": pp.department,
            "title": pp.title,
            "bio": pp.bio,
            "research_areas": list(pp.research_areas) if pp.research_areas is not None else None,
            "total_supervised": pp.total_supervised or 0,
            "avg_project_rating": float(pp.avg_project_rating)
            if pp.avg_project_rating is not None
            else None,
        }
    if u.role == "company":
        cp = db.scalars(select(CompanyProfile).where(CompanyProfile.user_id == u.id)).first()
        if not cp:
            return None
        return {
            "company_name": cp.company_name,
            "industry": cp.industry,
            "location": cp.location,
            "website": cp.website,
            "description": cp.description,
            "interests": list(cp.interests) if cp.interests is not None else None,
            "total_opportunities": cp.total_opportunities or 0,
        }
    return None


def user_with_profile(db: Session, u: User) -> dict[str, Any]:
    out = user_base_dict(u)
    out["profile"] = profile_dict(db, u)
    out["created_at"] = u.created_at.isoformat() if u.created_at else None
    out["updated_at"] = u.updated_at.isoformat() if u.updated_at else None
    return out


def user_with_profile_minimal_public(db: Session, u: User) -> dict[str, Any]:
    """Public-safe payload (no email)."""
    out = user_base_dict(u)
    out.pop("email", None)
    out["profile"] = profile_dict(db, u)
    return out
