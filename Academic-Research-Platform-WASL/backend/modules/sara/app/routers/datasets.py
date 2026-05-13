from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, Dataset
from app.responses import ok
from app.services.storage import delete_file_from_bucket, upload_file_to_bucket

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

DATASET_MAX_BYTES = 200 * 1024 * 1024


def _now():
    return datetime.now(timezone.utc)


def _split_tags(raw: str | None) -> list[str] | None:
    if not raw:
        return None
    tags = [t.strip() for t in raw.replace(";", ",").split(",") if t.strip()]
    return tags or None


def _serialize(d: Dataset) -> dict:
    return {
        "id": str(d.id),
        "user_id": str(d.user_id),
        "title": d.title,
        "description": d.description,
        "category": d.category,
        "tags": list(d.tags) if d.tags else None,
        "file_url": d.file_url,
        "file_key": d.file_key,
        "file_size": d.file_size,
        "format": d.format,
        "downloads": d.downloads or 0,
        "created_at": d.created_at.isoformat(),
    }


def _authorize_owner_or_admin(ds: Dataset, user: User) -> None:
    if ds.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )


@router.get("")
def list_datasets(db: Session = Depends(get_db)):
    rows = db.scalars(select(Dataset).order_by(Dataset.created_at.desc())).all()
    return ok([_serialize(r) for r in rows])


@router.get("/{dataset_id}")
def get_dataset(dataset_id: uuid.UUID, db: Session = Depends(get_db)):
    d = db.scalars(select(Dataset).where(Dataset.id == dataset_id)).first()
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Dataset not found"}},
        )
    return ok(_serialize(d))


@router.post("")
async def create_dataset(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    title: str = Form(...),
    description: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    dataset_format: str | None = Form(None),
    file: UploadFile | None = File(None),
):
    now = _now()
    ds_id = uuid.uuid4()

    ds = Dataset(
        id=ds_id,
        user_id=current.id,
        title=title,
        description=description,
        category=category,
        tags=_split_tags(tags),
        format=dataset_format,
        downloads=0,
        created_at=now,
    )
    db.add(ds)
    db.flush()

    if file and file.filename:
        raw = await file.read()
        if len(raw) > DATASET_MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "File exceeds 200MB limit"}},
            )
        ct = file.content_type or "application/octet-stream"
        url, key = upload_file_to_bucket(
            folder_prefix=f"datasets/{ds_id}",
            filename=file.filename or "dataset.bin",
            content_type=ct,
            data=raw,
        )
        ds.file_url = url
        ds.file_key = key
        ds.file_size = len(raw)

    db.commit()
    row = db.scalars(select(Dataset).where(Dataset.id == ds_id)).one()
    return ok(_serialize(row))


@router.put("/{dataset_id}")
async def update_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    title: str | None = Form(None),
    description: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    dataset_format: str | None = Form(None),
    file: UploadFile | None = File(None),
):
    d = db.scalars(select(Dataset).where(Dataset.id == dataset_id)).first()
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Dataset not found"}},
        )
    _authorize_owner_or_admin(d, current)

    if title is not None:
        d.title = title
    if description is not None:
        d.description = description
    if category is not None:
        d.category = category
    if tags is not None:
        d.tags = _split_tags(tags)
    if dataset_format is not None:
        d.format = dataset_format

    if file and file.filename:
        raw = await file.read()
        if len(raw) > DATASET_MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "File exceeds 200MB limit"}},
            )
        ct = file.content_type or "application/octet-stream"
        url, key = upload_file_to_bucket(
            folder_prefix=f"datasets/{dataset_id}",
            filename=file.filename or "dataset.bin",
            content_type=ct,
            data=raw,
        )
        d.file_url = url
        d.file_key = key
        d.file_size = len(raw)

    db.commit()
    row = db.scalars(select(Dataset).where(Dataset.id == dataset_id)).one()
    return ok(_serialize(row))


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    d = db.scalars(select(Dataset).where(Dataset.id == dataset_id)).first()
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Dataset not found"}},
        )
    _authorize_owner_or_admin(d, current)
    fk = d.file_key
    db.delete(d)
    db.commit()
    delete_file_from_bucket(fk)
    return ok({"deleted": True})
