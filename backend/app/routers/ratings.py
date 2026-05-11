import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import CurrentUser, get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models.project import Project
from app.models.rating import Rating
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingListResponse, RatingResponse, RatingUpdate

router = APIRouter()


@router.get("/projects/{project_id}/ratings", response_model=RatingListResponse)
def get_project_ratings(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    _ensure_project_exists(db, project_id)
    ratings = db.scalars(
        select(Rating)
        .options(joinedload(Rating.user))
        .where(Rating.project_id == project_id)
        .order_by(Rating.created_at.desc())
    ).all()
    avg_rating, total_ratings = _rating_stats(db, project_id)

    return {
        "ratings": [_serialize_rating(rating) for rating in ratings],
        "avg_rating": avg_rating,
        "total_ratings": total_ratings,
    }


@router.post(
    "/projects/{project_id}/ratings",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
)
def save_project_rating(
    project_id: uuid.UUID,
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Rating:
    if current_user.role not in ("student", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can rate projects",
        )

    _ensure_project_exists(db, project_id)

    rating = db.scalar(
        select(Rating).where(
            Rating.project_id == project_id,
            Rating.user_id == current_user.id,
        )
    )
    if rating is None:
        rating = Rating(
            project_id=project_id,
            user_id=current_user.id,
            rating=payload.rating,
        )
        db.add(rating)
    else:
        rating.rating = payload.rating

    db.flush()
    _recalculate_project_rating(db, project_id)
    db.commit()
    db.refresh(rating)
    return rating


@router.put("/ratings/{rating_id}", response_model=RatingResponse)
def update_rating(
    rating_id: uuid.UUID,
    payload: RatingUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Rating:
    if current_user.role not in ("student", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update ratings",
        )

    rating = db.get(Rating, rating_id)
    if rating is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    if rating.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the rating owner can update this rating",
        )

    rating.rating = payload.rating
    db.flush()
    _recalculate_project_rating(db, rating.project_id)
    db.commit()
    db.refresh(rating)
    return rating


@router.delete("/ratings/{rating_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    rating_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    rating = db.get(Rating, rating_id)
    if rating is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    if rating.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the rating owner or an admin can delete this rating",
        )

    project_id = rating.project_id
    db.delete(rating)
    db.flush()
    _recalculate_project_rating(db, project_id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _ensure_project_exists(db: Session, project_id: uuid.UUID) -> None:
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


def _rating_stats(db: Session, project_id: uuid.UUID) -> tuple[float, int]:
    avg_value, total = db.execute(
        select(func.avg(Rating.rating), func.count(Rating.id)).where(Rating.project_id == project_id)
    ).one()
    return round(float(avg_value or 0), 2), int(total or 0)


def _recalculate_project_rating(db: Session, project_id: uuid.UUID) -> None:
    avg_rating, total_ratings = _rating_stats(db, project_id)
    project = db.get(Project, project_id)
    if project is not None:
        project.avg_rating = avg_rating
        project.total_ratings = total_ratings


def _serialize_rating(rating: Rating) -> dict[str, object]:
    return {
        "id": rating.id,
        "project_id": rating.project_id,
        "user_id": rating.user_id,
        "rating": rating.rating,
        "created_at": rating.created_at,
        "updated_at": rating.updated_at,
        "user": _serialize_user(rating.user),
    }


def _serialize_user(user: User | None) -> dict[str, object] | None:
    if user is None:
        return None

    return {
        "id": user.id,
        "name": user.full_name,
    }
