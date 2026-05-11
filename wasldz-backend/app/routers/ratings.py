import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models import User, Project, Rating
from app.responses import ok
from app.schemas.rating import RatingCreate
from app.services.notify import notify

router = APIRouter(prefix="/api/projects", tags=["ratings"])


def _now():
    return datetime.now(timezone.utc)


def recalc_project_ratings(db: Session, project_id: uuid.UUID) -> None:
    row = db.execute(
        select(func.avg(Rating.rating), func.count(Rating.id)).where(Rating.project_id == project_id)
    ).one()
    avg_val, cnt = row[0], int(row[1] or 0)
    proj = db.scalars(select(Project).where(Project.id == project_id)).one()
    proj.avg_rating = float(avg_val) if cnt and avg_val is not None else None
    proj.total_ratings = cnt


def _can_view_for_rating(project: Project, viewer: User | None) -> bool:
    if project.status == "approved":
        return True
    if viewer and (project.user_id == viewer.id or viewer.role == "admin"):
        return True
    return False


def _rating_out(db: Session, r: Rating) -> dict:
    au = db.scalars(select(User).where(User.id == r.user_id)).first()
    return {
        "id": str(r.id),
        "project_id": str(r.project_id),
        "user_id": str(r.user_id),
        "user_name": au.name if au else None,
        "user_avatar_url": au.avatar_url if au else None,
        "rating": r.rating,
        "created_at": r.created_at.isoformat(),
    }


@router.get("/{project_id}/ratings")
def list_ratings(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not _can_view_for_rating(p, viewer):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )
    rows = db.scalars(select(Rating).where(Rating.project_id == project_id).order_by(Rating.created_at.desc())).all()
    my_rating = None
    if viewer:
        mine = db.scalars(
            select(Rating).where(Rating.project_id == project_id, Rating.user_id == viewer.id)
        ).first()
        if mine:
            my_rating = mine.rating
    return ok(
        {
            "ratings": [_rating_out(db, rr) for rr in rows],
            "my_rating": my_rating,
        }
    )


@router.post("/{project_id}/ratings")
def post_rating(
    project_id: uuid.UUID,
    body: RatingCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    p = db.scalars(select(Project).where(Project.id == project_id)).first()
    if not p or not _can_view_for_rating(p, current):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Project not found"}},
        )

    now = _now()
    rid = uuid.uuid4()
    stmt = (
        insert(Rating)
        .values(
            id=rid,
            project_id=project_id,
            user_id=current.id,
            rating=body.rating,
            created_at=now,
        )
        .on_conflict_do_update(
            index_elements=["project_id", "user_id"],
            set_={"rating": body.rating},
        )
    )
    db.execute(stmt)

    recalc_project_ratings(db, project_id)

    owner_id = p.user_id
    if owner_id != current.id:
        notify(
            db,
            user_id=owner_id,
            notif_type="project_rating",
            content=f'{current.name} rated your project "{p.title}".',
            link=f"/projects/{project_id}",
        )

    db.commit()
    row = db.scalars(
        select(Rating).where(Rating.project_id == project_id, Rating.user_id == current.id)
    ).one()

    return ok(_rating_out(db, row))
