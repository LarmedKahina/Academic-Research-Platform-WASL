import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_optional_current_user
from app.db.session import get_db
from app.models.project import Project

router = APIRouter()


@router.get("/projects")
def list_projects(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    try:
        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(Project.title.ilike(pattern) | Project.description.ilike(pattern))

        offset = (page - 1) * limit
        total = db.scalar(select(func.count(Project.id)).where(*filters)) or 0
        projects = db.scalars(
            select(Project)
            .where(*filters)
            .order_by(Project.created_at.desc().nullslast())
            .limit(limit)
            .offset(offset)
        ).all()

        return {
            "projects": [_serialize_project(project) for project in projects],
            "total": total,
            "limit": limit,
            "page": page,
        }
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Projects operation failed",
        ) from exc


@router.get("/projects/{project_id}")
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    try:
        project = db.get(Project, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return _serialize_project(project)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Projects operation failed",
        ) from exc


def _serialize_project(project: Project) -> dict[str, object]:
    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "avg_rating": float(project.avg_rating or 0),
        "total_ratings": project.total_ratings,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
