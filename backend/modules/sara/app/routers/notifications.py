from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, Notification
from app.responses import ok

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _now():
    return datetime.now(timezone.utc)


def _serialize(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "user_id": str(n.user_id),
        "type": n.type,
        "content": n.content,
        "read": n.read,
        "link": n.link,
        "created_at": n.created_at.isoformat(),
    }


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = db.scalars(
        select(Notification)
        .where(Notification.user_id == current.id)
        .order_by(Notification.created_at.desc())
    ).all()
    return ok([_serialize(r) for r in rows])


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    n = db.scalars(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current.id)
    ).first()
    if not n:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Notification not found"}},
        )
    n.read = True
    db.commit()
    refreshed = db.scalars(select(Notification).where(Notification.id == notification_id)).one()
    return ok(_serialize(refreshed))


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = db.scalars(
        select(Notification).where(
            Notification.user_id == current.id,
            Notification.read.is_(False),
        )
    ).all()
    count = 0
    for n in rows:
        n.read = True
        count += 1
    db.commit()
    return ok({"updated": count})


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    n = db.scalars(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current.id)
    ).first()
    if not n:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Notification not found"}},
        )
    db.delete(n)
    db.commit()
    return ok({"deleted": True})
