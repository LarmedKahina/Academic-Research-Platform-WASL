import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    User,
    StudentProfile,
    ProfessorProfile,
    CompanyProfile,
    VerificationDocument,
)
from app.responses import ok
from app.schemas.auth import LoginRequest
from app.services.auth import hash_password, verify_password, create_access_token
from app.services.storage import upload_file_to_bucket
from app.services.user_response import user_with_profile

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _create_profile_for_role(
    db: Session,
    user_id: uuid.UUID,
    role: str,
    *,
    university: str | None,
    department: str | None,
    title: str | None,
    company_name: str | None,
    industry: str | None,
) -> None:
    if role == "admin":
        return
    if role == "student":
        db.add(
            StudentProfile(
                user_id=user_id,
                university=university,
                department=department,
            )
        )
    elif role == "professor":
        db.add(
            ProfessorProfile(
                user_id=user_id,
                university=university,
                department=department,
                title=title,
            )
        )
    elif role == "company":
        db.add(
            CompanyProfile(
                user_id=user_id,
                company_name=company_name,
                industry=industry,
            )
        )


@router.post("/register")
async def register(
    db: Session = Depends(get_db),
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    role: str = Form(...),
    university: str | None = Form(None),
    department: str | None = Form(None),
    title: str | None = Form(None),
    company_name: str | None = Form(None),
    industry: str | None = Form(None),
    verification: UploadFile | None = File(None),
):
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Password must be at least 8 characters"}},
        )
    if role not in {"student", "professor", "company", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"message": "Invalid role"}},
        )

    now = _now()
    user_id = uuid.uuid4()
    # Students can use the platform immediately (no admin account gate).
    initial_verified = role == "student"
    try:
        user = User(
            id=user_id,
            email=email.strip().lower(),
            password_hash=hash_password(password),
            name=name,
            role=role,
            verified=initial_verified,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        _create_profile_for_role(
            db,
            user_id,
            role,
            university=university or None,
            department=department or None,
            title=title or None,
            company_name=company_name or None,
            industry=industry or None,
        )

        if role != "admin" and verification and verification.filename:
            raw = await verification.read()
            ct = verification.content_type or "application/octet-stream"
            url, _storage_path = upload_file_to_bucket(
                folder_prefix=f"verification/{user_id}",
                filename=verification.filename,
                content_type=ct,
                data=raw,
            )
            db.add(
                VerificationDocument(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    document_url=url,
                    status="pending",
                    submitted_at=now,
                )
            )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"message": "Email already registered"}},
        )

    refreshed = db.scalars(select(User).where(User.id == user_id)).one()
    token = create_access_token(
        subject=str(refreshed.id), role=refreshed.role, verified=bool(refreshed.verified)
    )
    payload = {
        "access_token": token,
        "token_type": "bearer",
        "user": user_with_profile(db, refreshed),
    }
    return ok(payload)


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.scalars(select(User).where(User.email == email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "error": {"message": "Invalid credentials"}},
        )

    token = create_access_token(
        subject=str(user.id), role=user.role, verified=bool(user.verified)
    )
    payload = {
        "access_token": token,
        "token_type": "bearer",
        "user": user_with_profile(db, user),
    }
    return ok(payload)


@router.post("/logout")
def logout():
    return ok({"logged_out": True})


@router.get("/me")
def auth_me(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    refreshed = db.scalars(select(User).where(User.id == current.id)).one()
    return ok(user_with_profile(db, refreshed))
