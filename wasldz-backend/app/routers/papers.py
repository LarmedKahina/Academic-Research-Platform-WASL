from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Paper, User
from app.responses import ok
from app.services.storage import delete_file_from_bucket, upload_file_to_bucket

router = APIRouter(prefix="/api/papers", tags=["papers"])

PDF_MAX_BYTES = 50 * 1024 * 1024


def _now():
    return datetime.now(timezone.utc)


def _split_list(raw: str | None) -> list[str] | None:
    if not raw:
        return None
    items = [t.strip() for t in raw.replace(";", ",").split(",") if t.strip()]
    return items or None


def _serialize(p: Paper) -> dict:
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "title": p.title,
        "abstract": p.abstract,
        "tags": list(p.tags) if p.tags else None,
        "authors": list(p.authors) if p.authors else None,
        "file_url": p.file_url,
        "file_key": p.file_key,
        "pages": p.pages,
        "citations": p.citations,
        "views": p.views,
        "created_at": p.created_at.isoformat(),
    }


def _authorize(p: Paper, user: User) -> None:
    if p.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"message": "Not allowed"}},
        )


@router.get("")
def list_papers(db: Session = Depends(get_db)):
    rows = db.scalars(select(Paper).order_by(Paper.created_at.desc())).all()
    return ok([_serialize(r) for r in rows])


@router.get("/{paper_id}")
def get_paper(paper_id: uuid.UUID, db: Session = Depends(get_db)):
    p = db.scalars(select(Paper).where(Paper.id == paper_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Paper not found"}},
        )
    return ok(_serialize(p))


@router.post("")
async def create_paper(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    title: str = Form(...),
    abstract: str | None = Form(None),
    tags: str | None = Form(None),
    authors: str | None = Form(None),
    pages: int | None = Form(None),
    citations: int | None = Form(None),
    file: UploadFile | None = File(None),
):
    now = _now()
    pid = uuid.uuid4()
    row = Paper(
        id=pid,
        user_id=current.id,
        title=title,
        abstract=abstract,
        tags=_split_list(tags),
        authors=_split_list(authors),
        pages=pages,
        citations=citations,
        views=0,
        created_at=now,
    )
    db.add(row)
    db.flush()

    if file and file.filename:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "Only PDF uploads are allowed"}},
            )
        raw = await file.read()
        if len(raw) > PDF_MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "File exceeds 50MB limit"}},
            )
        ct = file.content_type or "application/pdf"
        url, key = upload_file_to_bucket(
            folder_prefix=f"papers/{pid}",
            filename=file.filename,
            content_type=ct,
            data=raw,
        )
        row.file_url = url
        row.file_key = key

    db.commit()
    saved = db.scalars(select(Paper).where(Paper.id == pid)).one()
    return ok(_serialize(saved))


@router.put("/{paper_id}")
async def update_paper(
    paper_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    title: str | None = Form(None),
    abstract: str | None = Form(None),
    tags: str | None = Form(None),
    authors: str | None = Form(None),
    pages: int | None = Form(None),
    citations: int | None = Form(None),
    file: UploadFile | None = File(None),
):
    p = db.scalars(select(Paper).where(Paper.id == paper_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Paper not found"}},
        )
    _authorize(p, current)

    if title is not None:
        p.title = title
    if abstract is not None:
        p.abstract = abstract
    if tags is not None:
        p.tags = _split_list(tags)
    if authors is not None:
        p.authors = _split_list(authors)
    if pages is not None:
        p.pages = pages
    if citations is not None:
        p.citations = citations

    if file and file.filename:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "Only PDF uploads are allowed"}},
            )
        raw = await file.read()
        if len(raw) > PDF_MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "error": {"message": "File exceeds 50MB limit"}},
            )
        ct = file.content_type or "application/pdf"
        url, key = upload_file_to_bucket(
            folder_prefix=f"papers/{paper_id}",
            filename=file.filename,
            content_type=ct,
            data=raw,
        )
        p.file_url = url
        p.file_key = key

    db.commit()
    saved = db.scalars(select(Paper).where(Paper.id == paper_id)).one()
    return ok(_serialize(saved))


@router.delete("/{paper_id}")
def delete_paper(
    paper_id: uuid.UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    p = db.scalars(select(Paper).where(Paper.id == paper_id)).first()
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": {"message": "Paper not found"}},
        )
    _authorize(p, current)
    fk = p.file_key
    db.delete(p)
    db.commit()
    delete_file_from_bucket(fk)
    return ok({"deleted": True})
