import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import CurrentUser, get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models.comment import Comment
from app.models.project import Project
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentListResponse, CommentResponse, CommentUpdate

router = APIRouter()


@router.get("/projects/{project_id}/comments", response_model=CommentListResponse)
def get_project_comments(
    project_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    _ensure_project_exists(db, project_id)
    total = db.scalar(select(func.count(Comment.id)).where(Comment.project_id == project_id)) or 0
    comments = db.scalars(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.project_id == project_id)
        .order_by(Comment.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "comments": [_serialize_comment(comment) for comment in comments],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post(
    "/projects/{project_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_comment(
    project_id: uuid.UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    _ensure_project_exists(db, project_id)

    comment = Comment(
        project_id=project_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    _create_comment_notification(db, project_id, current_user)

    comment_with_user = _get_comment_with_user(db, comment.id)
    if comment_with_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return _serialize_comment(comment_with_user)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: uuid.UUID,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    comment = _get_comment_with_user(db, comment_id)
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the comment owner can update this comment",
        )

    comment.content = payload.content
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the comment owner or an admin can delete this comment",
        )

    db.delete(comment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _ensure_project_exists(db: Session, project_id: uuid.UUID) -> None:
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


def _get_comment_with_user(db: Session, comment_id: uuid.UUID) -> Comment | None:
    return db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == comment_id)
    )


def _create_comment_notification(
    db: Session,
    project_id: uuid.UUID,
    current_user: CurrentUser,
) -> None:
    try:
        project_owner_id = db.execute(
            text("SELECT user_id FROM projects WHERE id = :project_id"),
            {"project_id": project_id},
        ).scalar_one_or_none()
        if project_owner_id is None or str(project_owner_id) == str(current_user.id):
            return

        commenter = current_user.email or "Someone"
        db.execute(
            text(
                """
                INSERT INTO notifications (user_id, type, content, link)
                VALUES (:user_id, 'comment', :content, :link)
                """
            ),
            {
                "user_id": project_owner_id,
                "content": f"{commenter} commented on your project",
                "link": f"/projects/{project_id}",
            },
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()


def _serialize_comment(comment: Comment) -> dict[str, object]:
    user = comment.user
    return {
        "id": comment.id,
        "project_id": comment.project_id,
        "user_id": comment.user_id,
        "content": comment.content,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user_name": user.full_name if user else None,
        "user_avatar": user.avatar_url if user else None,
        "user": _serialize_user(user),
    }


def _serialize_user(user: User | None) -> dict[str, object] | None:
    if user is None:
        return None
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }
