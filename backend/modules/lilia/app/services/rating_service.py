import uuid
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.project import Project
from app.models.rating import Rating
from app.models.user import User


def _normalize_average(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def create_rating(
    db: Session,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    rating: int,
    user_role: str | None = None,
) -> Rating:
    if user_role not in {"student", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can rate projects",
        )

    project = db.scalar(
        select(Project)
        .where(Project.id == project_id)
        .with_for_update()
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    existing_rating = db.scalar(
        select(Rating).where(
            Rating.project_id == project_id,
            Rating.user_id == user_id,
        )
    )
    if existing_rating is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User has already rated this project",
        )

    rating_row = Rating(
        user_id=user_id,
        project_id=project_id,
        rating=rating,
    )
    db.add(rating_row)

    previous_total = project.total_ratings or 0
    previous_average = project.avg_rating or Decimal("0")
    new_total = previous_total + 1
    new_average = (
        (previous_average * previous_total) + Decimal(rating)
    ) / Decimal(new_total)

    project.total_ratings = new_total
    project.avg_rating = _normalize_average(new_average)

    db.commit()
    db.refresh(rating_row)
    return rating_row


def update_rating(
    db: Session,
    rating_id: uuid.UUID,
    user_id: uuid.UUID,
    new_rating: int,
) -> Rating:
    rating_row = db.scalar(
        select(Rating)
        .options(joinedload(Rating.project))
        .where(Rating.id == rating_id)
    )
    if rating_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found",
        )

    if rating_row.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the rating owner can update this rating",
        )

    project = db.scalar(
        select(Project)
        .where(Project.id == rating_row.project_id)
        .with_for_update()
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    total = project.total_ratings or 0
    if total <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project rating totals are inconsistent",
        )

    old_rating = rating_row.rating
    if old_rating == new_rating:
        return rating_row

    previous_average = project.avg_rating or Decimal("0")
    new_average = (
        (previous_average * total)
        - Decimal(old_rating)
        + Decimal(new_rating)
    ) / Decimal(total)

    rating_row.rating = new_rating
    project.avg_rating = _normalize_average(new_average)

    db.commit()
    db.refresh(rating_row)
    return rating_row


def delete_rating(
    db: Session,
    rating_id: uuid.UUID,
    user_id: uuid.UUID,
    user_role: str | None = None,
) -> None:
    rating_row = db.scalar(
        select(Rating).where(Rating.id == rating_id)
    )
    if rating_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found",
        )

    is_owner = rating_row.user_id == user_id
    is_admin = user_role == "admin"
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the rating owner or an admin can delete this rating",
        )

    project = db.scalar(
        select(Project)
        .where(Project.id == rating_row.project_id)
        .with_for_update()
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    previous_total = project.total_ratings or 0
    if previous_total <= 1:
        project.total_ratings = 0
        project.avg_rating = Decimal("0")
    else:
        previous_average = project.avg_rating or Decimal("0")
        new_total = previous_total - 1
        new_average = (
            (previous_average * previous_total) - Decimal(rating_row.rating)
        ) / Decimal(new_total)

        project.total_ratings = new_total
        project.avg_rating = _normalize_average(new_average)

    db.delete(rating_row)
    db.commit()


def get_project_ratings(
    db: Session,
    project_id: uuid.UUID,
) -> dict[str, object]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    rating_rows = db.scalars(
        select(Rating)
        .options(joinedload(Rating.user))
        .where(Rating.project_id == project_id)
        .order_by(Rating.created_at.desc())
    ).all()

    return {
        "ratings": [
            {
                "id": rating.id,
                "project_id": rating.project_id,
                "user_id": rating.user_id,
                "rating": rating.rating,
                "created_at": rating.created_at,
                "updated_at": rating.updated_at,
                "user": _serialize_rating_user(rating.user),
            }
            for rating in rating_rows
        ],
        "avg_rating": float(project.avg_rating or Decimal("0")),
        "total_ratings": project.total_ratings or 0,
    }


def _serialize_rating_user(user: User | None) -> dict[str, object] | None:
    if user is None:
        return None

    return {
        "id": user.id,
        "name": user.full_name,
    }
