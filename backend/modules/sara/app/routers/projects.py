from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, func, nulls_last, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models import User, Project, Comment
from app.responses import ok
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.storage import delete_file_from_bucket, upload_file_to_bucket

router = APIRouter(prefix="/api/projects", tags=["projects"])

PDF_MAX_BYTES = 50 * 1024 * 1024


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_project(db: Session, p: Project) -> dict:
    avg = float(p.avg_rating) if p.avg_rating is not None else None
    auth = db.scalars(select(User).where(User.id == p.user_id)).first()
    sup = (
        db.scalars(select(User).where(User.id == p.supervisor_id)).first() if p.supervisor_id else None
    )
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "supervisor_id": str(p.supervisor_id) if p.supervisor_id else None,
        "title": p.title,
        "abstract": p.abstract,
        "tags": list(p.tags) if p.tags is not None else None,
        "university": p.university,
        "department": p.department,
        "project_type": p.project_type,
        "file_url": p.file_url,
        "file_key": p.file_key,
        "file_size": p.file_size,
        "status": p.status,
        "views": p.views or 0,
        "downloads": p.downloads or 0,
        "avg_rating": avg,
        "total_ratings": p.total_ratings or 0,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
        "author_name": auth.name if auth else None,
        "supervisor_name": sup.name if sup else None,
    }


def _serialize_detail(db: Session, p: Project) -> dict:
    base = _serialize_project(db, p)
    comments_count = (
        db.scalar(select(func.count()).select_from(Comment).where(Comment.project_id == p.id)) or 0
    )
    base["comments_count"] = int(comments_count)
    return base


def _can_access_project(project: Project, viewer: User | None) -> bool:
    if project.status == "approved":
        return True
    if viewer and (project.user_id == viewer.id or viewer.role == "admin"):
        return True
    return False


def _listing_statement(viewer: User | None):
    q = select(Project)
    approved = Project.status == "approved"
    if viewer is None:
        return q.where(approved)
    own = Project.user_id == viewer.id
    if viewer.role == "admin":
        return q
    return q.where(or_(approved, own))


@router.get("")
def list_projects(
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    university: str | None = None,
    department: str | None = None,
    project_type: str | None = None,
    q: str | None = Query(None, description="Search title or abstract"),
    tags: str | None = Query(None, description="Comma-separated tags; any match"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("newest", pattern="^(newest|most_viewed|top_rated)$"),
):
    stmt = _listing_statement(viewer)

    if q and q.strip():
        needle = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Project.title.ilike(needle), Project.abstract.ilike(needle)),
        )

    if university:
        stmt = stmt.where(Project.university.ilike(f"%{university.strip()}%"))
    if department:
        stmt = stmt.where(Project.department.ilike(f"%{department.strip()}%"))
    if project_type:
        stmt = stmt.where(Project.project_type == project_type)
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list and Project.tags is not None:
            stmt = stmt.where(Project.tags.overlap(tag_list))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    if sort_by == "newest":
        stmt = stmt.order_by(desc(Project.created_at))
    elif sort_by == "most_viewed":
        stmt = stmt.order_by(desc(Project.views))
    else:
        stmt = stmt.order_by(nulls_last(desc(Project.avg_rating)))

    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)
    rows = db.scalars(stmt).all()

    return ok(
        {
            "items": [_serialize_project(db, r) for r in rows],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": math.ceil(total / per_page) if per_page else 0,
        }
    )


@router.post("")
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Only students can create projects"}},
        )
    now = _now()
    supervisor_id = body.supervisor_id
    if supervisor_id:
        sup = db.scalars(select(User).where(User.id == supervisor_id)).first()
        if not sup or sup.role != "professor":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {"message": "supervisor_id must reference a professor"},
                },
            )

    p = Project(
        id=uuid.uuid4(),
        user_id=current.id,
        supervisor_id=supervisor_id,
        title=body.title,
        abstract=body.abstract,
        tags=body.tags or None,
        university=body.university,
        department=body.department,
        project_type=body.project_type,
        # Auto-publish student submissions for now (visible on public project list).
        status="approved",
        views=0,
        downloads=0,
        total_ratings=0,
        created_at=now,
        updated_at=now,
    )
    db.add(p)
    db.commit()
    refreshed = db.scalars(select(Project).where(Project.id == p.id)).one()
    return ok(_serialize_project(db, refreshed))


@router.get("/{project_id}/download")
def download_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not p.file_url or not _can_access_project(p, viewer):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "File not available"}},
        )
    p.downloads = (p.downloads or 0) + 1
    db.commit()
    return ok({"file_url": p.file_url, "downloads": p.downloads})


@router.post("/{project_id}/view")
def record_view(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not _can_access_project(p, viewer):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    p.views = (p.views or 0) + 1
    db.commit()
    return ok({"views": p.views})


@router.post("/{project_id}/files")
async def upload_project_file(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    if p.user_id != current.id and current.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )

    upload_name = file.filename or "document.pdf"
    if not upload_name.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Only PDF files are allowed"}},
        )
    raw = await file.read()
    if len(raw) > PDF_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "File exceeds 50MB limit"}},
        )
    if p.file_key:
        delete_file_from_bucket(p.file_key)
    ct = file.content_type or "application/pdf"
    url, key = upload_file_to_bucket(
        folder_prefix=f"projects/{project_id}",
        filename=upload_name,
        content_type=ct,
        data=raw,
    )
    now = _now()
    p.file_url = url
    p.file_key = key
    p.file_size = len(raw)
    p.updated_at = now
    db.commit()
    return ok({"file_url": url, "file_key": key, "file_size": len(raw)})


@router.put("/{project_id}")
def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    if p.user_id != current.id and current.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )

    patch = body.model_dump(exclude_unset=True)

    new_status = patch.pop("status", None)
    if new_status is not None:
        if current.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "error": {"message": "Only admins can change moderation status"}},
            )
        if new_status not in {"pending", "approved", "rejected"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "Invalid status"}},
            )
        p.status = new_status

    if "supervisor_id" in patch and patch["supervisor_id"]:
        sup = db.scalars(select(User).where(User.id == patch["supervisor_id"])).first()
        if not sup or sup.role != "professor":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "Invalid supervisor"}},
            )

    allowed_fields = (
        "title",
        "abstract",
        "tags",
        "university",
        "department",
        "project_type",
        "supervisor_id",
    )
    for field in allowed_fields:
        if field in patch:
            setattr(p, field, patch[field])

    if patch:
        stray = set(patch.keys()) - set(allowed_fields)
        stray.discard("status")
        if stray:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": f"Unsupported fields: {sorted(stray)}"}},
            )

    p.updated_at = _now()
    db.commit()
    refreshed = db.scalars(select(Project).where(Project.id == project_id)).one()
    return ok(_serialize_project(db, refreshed))


@router.delete("/{project_id}")
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    if p.user_id != current.id and current.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )
    fk = p.file_key
    db.delete(p)
    db.commit()
    delete_file_from_bucket(fk)
    return ok({"deleted": True})


@router.get("/{project_id}")
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not _can_access_project(p, viewer):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    return ok(_serialize_detail(db, p))
