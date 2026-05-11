import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.project import Project
from app.models.saved_project import SavedProject
from app.schemas.saved_project import SavedProjectListResponse, SavedProjectResponse

router = APIRouter()


@router.post(
    "/saved-projects/{project_id}",
    response_model=SavedProjectResponse,
)
def save_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SavedProject:
    _ensure_project_exists(db, project_id)

    existing = db.scalar(
        select(SavedProject).where(
            SavedProject.user_id == current_user.id,
            SavedProject.project_id == project_id,
        )
    )
    if existing is not None:
        return existing

    saved_project = SavedProject(user_id=current_user.id, project_id=project_id)
    db.add(saved_project)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(SavedProject).where(
                SavedProject.user_id == current_user.id,
                SavedProject.project_id == project_id,
            )
        )
        if existing is not None:
            return existing
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise _saved_projects_table_error(exc) from exc

    db.refresh(saved_project)
    return saved_project


@router.get("/saved-projects", response_model=SavedProjectListResponse)
def list_saved_projects(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    offset = (page - 1) * limit
    try:
        total = db.scalar(
            select(func.count(SavedProject.id)).where(SavedProject.user_id == current_user.id)
        ) or 0
        saved_projects = db.scalars(
            select(SavedProject)
            .options(joinedload(SavedProject.project))
            .where(SavedProject.user_id == current_user.id)
            .order_by(SavedProject.created_at.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    except SQLAlchemyError as exc:
        raise _saved_projects_table_error(exc) from exc

    return {
        "saved_projects": saved_projects,
        "total": total,
        "limit": limit,
        "page": page,
    }


@router.get("/saved-projects/{project_id}/status")
def is_project_saved(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, bool]:
    try:
        saved_project_id = db.scalar(
            select(SavedProject.id).where(
                SavedProject.user_id == current_user.id,
                SavedProject.project_id == project_id,
            )
        )
    except SQLAlchemyError as exc:
        raise _saved_projects_table_error(exc) from exc

    return {"saved": saved_project_id is not None}


@router.delete(
    "/saved-projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unsave_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    try:
        saved_project = db.scalar(
            select(SavedProject).where(
                SavedProject.user_id == current_user.id,
                SavedProject.project_id == project_id,
            )
        )
        if saved_project is not None:
            db.delete(saved_project)
            db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved project not found",
            )
    except SQLAlchemyError as exc:
        db.rollback()
        raise _saved_projects_table_error(exc) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/projects/{project_id}/save", response_model=SavedProjectResponse)
def save_project_legacy(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SavedProject:
    return save_project(project_id=project_id, db=db, current_user=current_user)


@router.get("/projects/{project_id}/saved")
def is_project_saved_legacy(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, bool]:
    return is_project_saved(project_id=project_id, db=db, current_user=current_user)


@router.delete("/projects/{project_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_project_legacy(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    return unsave_project(project_id=project_id, db=db, current_user=current_user)


def _ensure_project_exists(db: Session, project_id: uuid.UUID) -> None:
    project_exists = db.scalar(select(Project.id).where(Project.id == project_id))
    if project_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


def _saved_projects_table_error(exc: SQLAlchemyError) -> HTTPException:
    message = str(exc).lower()
    if "saved_projects" in message and ("does not exist" in message or "undefinedtable" in message):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="saved_projects table is not available in Supabase",
        )

    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Saved projects operation failed",
    )
