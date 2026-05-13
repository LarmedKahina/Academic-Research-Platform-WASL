from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import User, Report, Project
from app.responses import ok
from app.services.notify import notify

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _now():
    return datetime.now(timezone.utc)


class ReportCreate(BaseModel):
    project_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    reason: str
    details: str | None = None


class ReportResolve(BaseModel):
    status: str  # resolved, dismissed


def _serialize(r: Report, db: Session) -> dict:
    reporter = db.scalars(select(User).where(User.id == r.reported_by_user_id)).first()
    proj = db.scalars(select(Project).where(Project.id == r.project_id)).first() if r.project_id else None
    reported_user = db.scalars(select(User).where(User.id == r.user_id)).first() if r.user_id else None
    
    return {
        "id": str(r.id),
        "reported_by": reporter.name if reporter else None,
        "project_id": str(r.project_id) if r.project_id else None,
        "project_title": proj.title if proj else None,
        "user_id": str(r.user_id) if r.user_id else None,
        "user_name": reported_user.name if reported_user else None,
        "reason": r.reason,
        "details": r.details,
        "status": r.status,
        "created_at": r.created_at.isoformat(),
        "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
    }


@router.post("")
def create_report(
    body: ReportCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Report a project or user for abuse/violations."""
    if not body.project_id and not body.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Either project_id or user_id is required"}},
        )

    if body.project_id:
        proj = db.scalars(select(Project).where(Project.id == body.project_id)).first()
        if not proj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": {"message": "Project not found"}},
            )

    if body.user_id:
        user = db.scalars(select(User).where(User.id == body.user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": {"message": "User not found"}},
            )

    report = Report(
        id=uuid.uuid4(),
        reported_by_user_id=current.id,
        project_id=body.project_id,
        user_id=body.user_id,
        reason=body.reason,
        details=body.details,
        status="pending",
        created_at=_now(),
    )
    db.add(report)
    
    # Notify admins
    admins = db.scalars(select(User).where(User.role == "admin")).all()
    for admin in admins:
        notify(
            db,
            user_id=admin.id,
            notif_type="report_created",
            content=f'New report: {body.reason}',
            link=f"/admin/reports",
        )
    
    db.commit()
    refreshed = db.scalars(select(Report).where(Report.id == report.id)).one()
    return ok(_serialize(refreshed, db))


@router.get("")
def list_reports(
    db: Session = Depends(get_db),
    _admin: Annotated[User, Depends(require_admin)] = None,
    status_filter: str | None = Query(None, alias="status"),
):
    """Get all reports (admin only)."""
    stmt = select(Report).order_by(Report.created_at.desc())
    if status_filter:
        stmt = stmt.where(Report.status == status_filter)
    rows = db.scalars(stmt).all()
    return ok([_serialize(r, db) for r in rows])


@router.put("/{report_id}")
def resolve_report(
    report_id: uuid.UUID,
    body: ReportResolve,
    db: Session = Depends(get_db),
    _admin: Annotated[User, Depends(require_admin)] = None,
):
    """Resolve or dismiss a report (admin only)."""
    if body.status not in {"resolved", "dismissed"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Status must be resolved or dismissed"}},
        )

    report = db.scalars(select(Report).where(Report.id == report_id)).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Report not found"}},
        )

    report.status = body.status
    report.resolved_at = _now()
    db.commit()
    refreshed = db.scalars(select(Report).where(Report.id == report_id)).one()
    return ok(_serialize(refreshed, db))
