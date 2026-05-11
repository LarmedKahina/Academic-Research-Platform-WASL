import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models import User, Project, Comment
from app.responses import ok
from app.schemas.comment import CommentCreate, CommentUpdate
from app.services.notify import notify

router_nested = APIRouter(prefix="/api/projects", tags=["comments"])
router_manage = APIRouter(prefix="/api/comments", tags=["comments"])


def _now():
    return datetime.now(timezone.utc)


def _can_view_project(project: Project, viewer: User | None) -> bool:
    if project.status == "approved":
        return True
    if viewer and (project.user_id == viewer.id or viewer.role == "admin"):
        return True
    return False


def _comment_out(db: Session, c: Comment) -> dict:
    u = db.scalars(select(User).where(User.id == c.user_id)).first()
    return {
        "id": str(c.id),
        "project_id": str(c.project_id),
        "user_id": str(c.user_id),
        "user_name": u.name if u else None,
        "user_avatar_url": u.avatar_url if u else None,
        "content": c.content,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }


@router_nested.get("/{project_id}/comments")
def list_comments(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not _can_view_project(p, viewer):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    rows = db.scalars(
        select(Comment).where(Comment.project_id == project_id).order_by(Comment.created_at.asc())
    ).all()
    return ok([_comment_out(db, c) for c in rows])


@router_nested.post("/{project_id}/comments")
def create_comment(
    project_id: uuid.UUID,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not _can_view_project(p, current):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    now = _now()
    c = Comment(
        id=uuid.uuid4(),
        project_id=project_id,
        user_id=current.id,
        content=body.content,
        created_at=now,
        updated_at=now,
    )
    db.add(c)

    owner_id = p.user_id
    if owner_id != current.id:
        notify(
            db,
            user_id=owner_id,
            notif_type="project_comment",
            content=f'{current.name} commented on "{p.title}".',
            link=f"/projects/{project_id}",
        )

    db.commit()
    row = db.scalars(select(Comment).where(Comment.id == c.id)).one()
    return ok(_comment_out(db, row))


@router_manage.put("/{comment_id}")
def edit_comment(
    comment_id: uuid.UUID,
    body: CommentUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    c = db.scalars(select(Comment).where(Comment.id == comment_id)).first()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Comment not found"}},
        )
    if c.user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )
    now = _now()
    c.content = body.content
    c.updated_at = now
    db.commit()
    refreshed = db.scalars(select(Comment).where(Comment.id == comment_id)).one()
    return ok(_comment_out(db, refreshed))


@router_manage.delete("/{comment_id}")
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    c = db.scalars(select(Comment).where(Comment.id == comment_id)).first()
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Comment not found"}},
        )

    allowed = c.user_id == current.id or current.role == "admin"
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )

    db.delete(c)
    db.commit()
    return ok({"deleted": True})
