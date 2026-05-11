import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.comment import CommentCreate, CommentListResponse, CommentResponse, CommentUpdate
from app.services import comment_service

router = APIRouter(tags=["comments"])


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
    return comment_service.create_comment(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        content=payload.content,
        role=current_user.role,
    )


@router.get(
    "/projects/{project_id}/comments",
    response_model=CommentListResponse,
)
def get_project_comments(
    project_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return comment_service.get_project_comments(
        db=db,
        project_id=project_id,
        limit=limit,
        offset=offset,
    )


@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse,
)
def update_comment(
    comment_id: uuid.UUID,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    return comment_service.update_comment(
        db=db,
        comment_id=comment_id,
        user_id=current_user.id,
        content=payload.content,
    )


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    comment_service.delete_comment(
        db=db,
        comment_id=comment_id,
        user_id=current_user.id,
        role=current_user.role,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
