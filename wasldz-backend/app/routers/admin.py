from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import (
    User,
    VerificationDocument,
    Project,
    Dataset,
    Paper,
    Opportunity,
)
from app.responses import ok
from app.services.notify import notify

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _now():
    return datetime.now(timezone.utc)


class RejectUserBody(BaseModel):
    reason: str | None = None


class RejectProjectBody(BaseModel):
    reason: str | None = None


class SetRoleBody(BaseModel):
    role: str


@router.get("/stats")
def admin_stats(
    _admin_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    user_counts_rows = db.execute(select(User.role, func.count(User.id)).group_by(User.role)).all()
    proj_counts_rows = db.execute(select(Project.status, func.count(Project.id)).group_by(Project.status)).all()
    datasets_total = db.scalar(select(func.count()).select_from(Dataset)) or 0
    papers_total = db.scalar(select(func.count()).select_from(Paper)) or 0
    opps_total = db.scalar(select(func.count()).select_from(Opportunity)) or 0

    users_by_role = {r[0]: int(r[1]) for r in user_counts_rows}
    projects_by_status = {str(r[0] or ""): int(r[1]) for r in proj_counts_rows}

    week_ago = _now() - timedelta(days=7)
    new_users_week = db.scalar(select(func.count()).select_from(User).where(User.created_at >= week_ago)) or 0
    new_projects_week = db.scalar(select(func.count()).select_from(Project).where(Project.created_at >= week_ago)) or 0

    return ok(
        {
            "users_by_role": users_by_role,
            "projects_by_status": projects_by_status,
            "total_datasets": datasets_total,
            "total_papers": papers_total,
            "total_opportunities": opps_total,
            "new_users_this_week": new_users_week,
            "new_projects_this_week": new_projects_week,
        }
    )


@router.get("/users/pending")
def pending_verifications(
    _admin_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(User)
        .where(User.verified == False, User.role != "admin")
        .order_by(User.created_at.desc())
    ).all()
    payload = []
    for u in rows:
        docs = db.scalars(
            select(VerificationDocument)
            .where(VerificationDocument.user_id == u.id)
            .order_by(VerificationDocument.submitted_at.desc())
        ).all()
        payload.append(
            {
                "user": {
                    "id": str(u.id),
                    "name": u.name,
                    "email": u.email,
                    "role": u.role,
                    "verified": u.verified,
                    "created_at": u.created_at.isoformat(),
                },
                "verification_documents": [
                    {
                        "id": str(d.id),
                        "document_url": d.document_url,
                        "status": d.status,
                        "submitted_at": d.submitted_at.isoformat(),
                    }
                    for d in docs
                ],
            }
        )
    return ok({"users": payload})


@router.get("/users")
def list_users(
    _admin_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
    q: str | None = None,
):
    stmt = select(User).order_by(User.created_at.desc())
    if q:
        needle = f"%{q.strip()}%"
        stmt = stmt.where(or_(User.email.ilike(needle), User.name.ilike(needle)))
    rows = db.scalars(stmt.limit(500)).all()
    return ok(
        [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "verified": u.verified,
                "created_at": u.created_at.isoformat(),
            }
            for u in rows
        ]
    )


@router.put("/users/{user_id}/verify")
def verify_user(
    user_id: uuid.UUID,
    admin: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "User not found"}},
        )
    now = _now()

    docs = db.scalars(
        select(VerificationDocument).where(
            VerificationDocument.user_id == user_id,
            VerificationDocument.status == "pending",
        )
    ).all()

    user.verified = True
    user.updated_at = now
    for d in docs:
        d.status = "approved"
        d.reviewed_at = now
        d.reviewed_by = admin.id

    notify(
        db,
        user_id=user.id,
        notif_type="verification",
        content="Your WaslDZ account has been verified. You can now publish projects.",
        link="/profile/student",
    )
    db.commit()
    refreshed = db.scalars(select(User).where(User.id == user_id)).one()
    return ok({"id": str(refreshed.id), "verified": refreshed.verified})


@router.put("/users/{user_id}/reject")
def reject_verification(
    user_id: uuid.UUID,
    body: RejectUserBody,
    admin: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "User not found"}},
        )
    now = _now()

    docs = db.scalars(
        select(VerificationDocument).where(
            VerificationDocument.user_id == user_id,
            VerificationDocument.status == "pending",
        )
    ).all()
    user.verified = False
    user.updated_at = now
    for d in docs:
        d.status = "rejected"
        d.reviewed_at = now
        d.reviewed_by = admin.id

    reason = (body.reason or "").strip() or "No reason provided."
    notify(
        db,
        user_id=user.id,
        notif_type="verification_rejected",
        content=f"Your verification was not approved. Reason: {reason}",
        link="/profile/student",
    )
    db.commit()
    return ok({"id": str(user.id), "verified": user.verified, "documents_rejected": len(docs)})


@router.put("/users/{user_id}/role")
def set_user_role(
    user_id: uuid.UUID,
    body: SetRoleBody,
    _admin: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    if body.role not in {"student", "professor", "company", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Invalid role"}},
        )
    u = db.scalars(select(User).where(User.id == user_id)).first()
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "User not found"}},
        )
    u.role = body.role
    u.updated_at = _now()
    db.commit()
    return ok({"id": str(u.id), "role": u.role})


@router.get("/projects/pending")
def pending_projects(
    _admin_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Project).where(Project.status == "pending").order_by(Project.created_at.desc())
    ).all()
    out = []
    for p in rows:
        author = db.scalars(select(User).where(User.id == p.user_id)).first()
        out.append(
            {
                "id": str(p.id),
                "title": p.title,
                "university": p.university,
                "department": p.department,
                "author_name": author.name if author else None,
                "author_id": str(p.user_id),
                "file_url": p.file_url,
                "created_at": p.created_at.isoformat(),
            }
        )
    return ok(out)


@router.put("/projects/{project_id}/approve")
def approve_project(
    project_id: uuid.UUID,
    admin: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    p.status = "approved"
    p.updated_at = _now()
    notify(
        db,
        user_id=p.user_id,
        notif_type="project_approved",
        content=f'Your project "{p.title}" was approved and is now public.',
        link=f"/projects/{p.id}",
    )
    db.commit()
    return ok({"id": str(p.id), "status": p.status})


@router.put("/projects/{project_id}/reject")
def reject_project(
    project_id: uuid.UUID,
    body: RejectProjectBody,
    admin: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    p.status = "rejected"
    p.updated_at = _now()
    reason = (body.reason or "").strip() or "No reason provided."
    notify(
        db,
        user_id=p.user_id,
        notif_type="project_rejected",
        content=f'Your project "{p.title}" was rejected. Reason: {reason}',
        link="/submit",
    )
    db.commit()
    return ok({"id": str(p.id), "status": p.status})
