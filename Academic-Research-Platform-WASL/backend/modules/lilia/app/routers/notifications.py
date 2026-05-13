import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db

router = APIRouter()


@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    try:
        rows = db.execute(
            text(
                """
                SELECT id, user_id, type, content, link, read, created_at
                FROM notifications
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                """
            ),
            {"user_id": current_user.id},
        ).mappings().all()
        notifications = [dict(row) for row in rows]
        return {
            "notifications": notifications,
            "unread_count": sum(1 for item in notifications if not item.get("read")),
        }
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Notifications operation failed",
        ) from exc


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    try:
        row = db.execute(
            text(
                """
                UPDATE notifications
                SET read = true
                WHERE id = :notification_id AND user_id = :user_id
                RETURNING id, user_id, type, content, link, read, created_at
                """
            ),
            {"notification_id": notification_id, "user_id": current_user.id},
        ).mappings().one_or_none()
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        db.commit()
        return dict(row)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Notifications operation failed",
        ) from exc


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, bool]:
    try:
        db.execute(
            text("UPDATE notifications SET read = true WHERE user_id = :user_id"),
            {"user_id": current_user.id},
        )
        db.commit()
        return {"ok": True}
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Notifications operation failed",
        ) from exc


@router.delete("/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    try:
        result = db.execute(
            text("DELETE FROM notifications WHERE id = :notification_id AND user_id = :user_id"),
            {"notification_id": notification_id, "user_id": current_user.id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Notifications operation failed",
        ) from exc
