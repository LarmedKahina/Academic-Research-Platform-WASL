import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.rating import RatingCreate, RatingListResponse, RatingResponse, RatingUpdate
from app.services import rating_service

router = APIRouter(tags=["ratings"])


@router.post(
    "/projects/{project_id}/ratings",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_rating(
    project_id: uuid.UUID,
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> RatingResponse:
    return rating_service.create_rating(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        rating=payload.rating,
        user_role=current_user.role,
    )


@router.get(
    "/projects/{project_id}/ratings",
    response_model=RatingListResponse,
)
def get_project_ratings(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return rating_service.get_project_ratings(db=db, project_id=project_id)


@router.put(
    "/ratings/{rating_id}",
    response_model=RatingResponse,
)
def update_rating(
    rating_id: uuid.UUID,
    payload: RatingUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> RatingResponse:
    return rating_service.update_rating(
        db=db,
        rating_id=rating_id,
        user_id=current_user.id,
        new_rating=payload.rating,
    )


@router.delete(
    "/ratings/{rating_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_rating(
    rating_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    rating_service.delete_rating(
        db=db,
        rating_id=rating_id,
        user_id=current_user.id,
        user_role=current_user.role,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
