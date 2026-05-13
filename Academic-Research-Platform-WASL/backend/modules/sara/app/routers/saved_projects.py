from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, SavedProject, Project
from app.responses import ok

router = APIRouter(prefix="/api/saved-projects", tags=["saved-projects"])


def _now():
    return datetime.now(timezone.utc)


def _serialize(sp: SavedProject, db: Session) -> dict:
    proj = db.scalars(select(Project).where(Project.id == sp.project_id)).first()
    author = db.scalars(select(User).where(User.id == proj.user_id)).first() if proj else None
    return {
        "id": str(sp.id),
        "project_id": str(sp.project_id),
        "project_title": proj.title if proj else None,
        "project_author": author.name if author else None,
        "saved_at": sp.created_at.isoformat(),
    }


@router.post("")
def save_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Save a project (bookmark it)."""
    proj = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )

    # Check if already saved
    existing = db.scalars(
        select(SavedProject).where(
            SavedProject.user_id == current.id,
            SavedProject.project_id == project_id,
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"message": "Project already saved"}},
        )

    sp = SavedProject(
        id=uuid.uuid4(),
        user_id=current.id,
        project_id=project_id,
        created_at=_now(),
    )
    db.add(sp)
    db.commit()
    refreshed = db.scalars(select(SavedProject).where(SavedProject.id == sp.id)).one()
    return ok(_serialize(refreshed, db))


@router.get("")
def list_saved_projects(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Get all saved projects for current user."""
    rows = db.scalars(
        select(SavedProject)
        .where(SavedProject.user_id == current.id)
        .order_by(SavedProject.created_at.desc())
    ).all()
    return ok([_serialize(r, db) for r in rows])


@router.get("/{project_id}/is-saved")
def is_project_saved(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Check if a project is saved by current user."""
    saved = db.scalars(
        select(SavedProject).where(
            SavedProject.user_id == current.id,
            SavedProject.project_id == project_id,
        )
    ).first()
    return ok({"is_saved": saved is not None, "saved_at": saved.created_at.isoformat() if saved else None})


@router.delete("/{project_id}")
def unsave_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Remove a project from saved."""
    sp = db.scalars(
        select(SavedProject).where(
            SavedProject.user_id == current.id,
            SavedProject.project_id == project_id,
        )
    ).first()

    if not sp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Saved project not found"}},
        )

    db.delete(sp)
    db.commit()
    return ok({"deleted": True})
