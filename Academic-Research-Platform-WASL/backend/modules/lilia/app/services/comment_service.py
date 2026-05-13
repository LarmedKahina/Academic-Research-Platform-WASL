import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.comment import Comment
from app.models.project import Project
from app.models.user import User


def create_comment(
    db: Session,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    content: str,
    role: str,
) -> dict[str, object]:
    if role not in {"student", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can comment on projects",
        )

    project_exists = db.scalar(
        select(Project.id).where(Project.id == project_id)
    )
    if project_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    comment = Comment(
        user_id=user_id,
        project_id=project_id,
        content=content,
    )
    db.add(comment)
    db.commit()

    comment = _get_comment_with_user(db, comment.id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    return _serialize_comment(comment)


def update_comment(
    db: Session,
    comment_id: uuid.UUID,
    user_id: uuid.UUID,
    content: str,
) -> dict[str, object]:
    comment = _get_comment_with_user(db, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the comment owner can update this comment",
        )

    comment.content = content
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)


def delete_comment(
    db: Session,
    comment_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str,
) -> None:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.user_id != user_id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the comment owner or an admin can delete this comment",
        )

    db.delete(comment)
    db.commit()


def get_project_comments(
    db: Session,
    project_id: uuid.UUID,
    limit: int,
    offset: int,
) -> dict[str, object]:
    project_exists = db.scalar(
        select(Project.id).where(Project.id == project_id)
    )
    if project_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    total = db.scalar(
        select(func.count(Comment.id)).where(Comment.project_id == project_id)
    ) or 0

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


def _get_comment_with_user(db: Session, comment_id: uuid.UUID) -> Comment | None:
    return db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == comment_id)
    )


def _serialize_comment(comment: Comment) -> dict[str, object]:
    return {
        "id": comment.id,
        "project_id": comment.project_id,
        "user_id": comment.user_id,
        "content": comment.content,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user": _serialize_user(comment.user),
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
