from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Opportunity, OpportunityApplication, User
from app.responses import ok
from app.schemas.opportunity import ApplicationStatusUpdate
from app.services.notify import notify

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _serialize_mine(db: Session, a: OpportunityApplication) -> dict:
    opp = db.scalars(select(Opportunity).where(Opportunity.id == a.opportunity_id)).first()
    comp = db.scalars(select(User).where(User.id == opp.company_id)).first() if opp else None
    return {
        "id": str(a.id),
        "opportunity_id": str(a.opportunity_id),
        "opportunity_title": opp.title if opp else None,
        "company_name": comp.name if comp else None,
        "status": a.status,
        "message": a.message,
        "created_at": a.created_at.isoformat(),
    }


@router.get("/me")
def my_applications(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Only students have applications"}},
        )
    rows = db.scalars(
        select(OpportunityApplication)
        .where(OpportunityApplication.student_id == current.id)
        .order_by(OpportunityApplication.created_at.desc())
    ).all()
    return ok([_serialize_mine(db, r) for r in rows])


@router.put("/{application_id}/status")
def update_application_status(
    application_id: uuid.UUID,
    body: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if body.status not in {"accepted", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Status must be accepted or rejected"}},
        )

    app_row = db.scalars(select(OpportunityApplication).where(OpportunityApplication.id == application_id)).first()
    if not app_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Application not found"}},
        )
    opp = db.scalars(select(Opportunity).where(Opportunity.id == app_row.opportunity_id)).first()
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Opportunity missing"}},
        )

    if opp.company_id != current.id and current.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )

    student = db.scalars(select(User).where(User.id == app_row.student_id)).first()
    prev = app_row.status
    app_row.status = body.status
    now = datetime.now(timezone.utc)

    if student:
        notify(
            db,
            user_id=student.id,
            notif_type="application_decision",
            content=f'Your application to "{opp.title}" was marked {body.status}.',
            link=f"/opportunities/{opp.id}",
        )

    db.commit()
    refreshed = db.scalars(select(OpportunityApplication).where(OpportunityApplication.id == application_id)).one()
    return ok(
        {
            "id": str(refreshed.id),
            "opportunity_id": str(refreshed.opportunity_id),
            "student_id": str(refreshed.student_id),
            "status": refreshed.status,
            "message": refreshed.message,
            "created_at": refreshed.created_at.isoformat(),
            "previous_status": prev,
        }
    )
