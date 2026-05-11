import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.application import Application
from app.models.company import CompanyProfile
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    MyApplicationResponse,
)

router = APIRouter()


@router.post(
    "/opportunities/{opportunity_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_opportunity(
    opportunity_id: uuid.UUID,
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    try:
        opportunity = db.get(Opportunity, opportunity_id)
        if opportunity is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

        duplicate = db.scalar(
            select(Application.id).where(
                Application.opportunity_id == opportunity_id,
                Application.student_id == current_user.id,
            )
        )
        if duplicate is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already exists")

        student = db.get(User, current_user.id)
        student_name = _student_name(student, current_user)
        application = Application(
            opportunity_id=opportunity_id,
            student_id=current_user.id,
            status="pending",
            message=payload.message,
        )
        db.add(application)
        db.flush()
        _create_notification(
            db=db,
            user_id=opportunity.company_id,
            content=f"{student_name} applied to your opportunity",
            link=f"/opportunities/{opportunity_id}/applications",
        )
        db.commit()

        return _serialize_application(application, student)
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already exists") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        ) from exc


@router.get(
    "/opportunities/{opportunity_id}/applications",
    response_model=list[ApplicationResponse],
)
def get_opportunity_applications(
    opportunity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    try:
        opportunity = db.get(Opportunity, opportunity_id)
        if opportunity is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        if current_user.role != "admin" and (
            current_user.role != "company" or opportunity.company_id != current_user.id
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        rows = db.execute(
            select(Application, User)
            .join(User, User.id == Application.student_id)
            .where(Application.opportunity_id == opportunity_id)
            .order_by(Application.created_at.desc())
        ).all()
        return [_serialize_application(application, student) for application, student in rows]
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        ) from exc


@router.get("/applications/mine", response_model=list[MyApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    try:
        rows = db.execute(
            select(Application, Opportunity, CompanyProfile.company_name)
            .join(Opportunity, Opportunity.id == Application.opportunity_id)
            .join(CompanyProfile, CompanyProfile.user_id == Opportunity.company_id, isouter=True)
            .where(Application.student_id == current_user.id)
            .order_by(Application.created_at.desc())
        ).all()
        return [
            _serialize_my_application(application, opportunity, company_name)
            for application, opportunity, company_name in rows
        ]
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        ) from exc


@router.put(
    "/applications/{application_id}/status",
    response_model=ApplicationResponse,
)
def update_application_status(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    try:
        row = db.execute(
            select(Application, Opportunity, User)
            .join(Opportunity, Opportunity.id == Application.opportunity_id)
            .join(User, User.id == Application.student_id)
            .where(Application.id == application_id)
        ).one_or_none()
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

        application, opportunity, student = row
        if current_user.role != "company" or opportunity.company_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        application.status = payload.status
        application.updated_at = datetime.utcnow()
        content = (
            "Your application was accepted!"
            if payload.status == "accepted"
            else "Your application was not selected."
        )
        _create_notification(
            db=db,
            user_id=application.student_id,
            content=content,
            link="/applications/mine",
        )
        db.commit()
        db.refresh(application)
        return _serialize_application(application, student)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        ) from exc


def _create_notification(
    db: Session,
    user_id: uuid.UUID,
    content: str,
    link: str,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO notifications (user_id, type, content, link)
            VALUES (:user_id, 'application', :content, :link)
            """
        ),
        {
            "user_id": user_id,
            "content": content,
            "link": link,
        },
    )


def _serialize_application(application: Application, student: User | None) -> dict[str, object]:
    return {
        "id": application.id,
        "opportunity_id": application.opportunity_id,
        "student_id": application.student_id,
        "student_name": _student_name(student),
        "student_avatar": student.avatar_url if student else None,
        "status": application.status,
        "message": application.message,
        "created_at": application.created_at,
    }


def _serialize_my_application(
    application: Application,
    opportunity: Opportunity,
    company_name: str | None,
) -> dict[str, object]:
    return {
        "id": application.id,
        "opportunity_id": application.opportunity_id,
        "student_id": application.student_id,
        "status": application.status,
        "message": application.message,
        "created_at": application.created_at,
        "opportunity_title": opportunity.title,
        "company_name": company_name,
    }


def _student_name(student: User | None, current_user: CurrentUser | None = None) -> str:
    if student is not None:
        return student.full_name or student.email or "Unknown student"
    if current_user is not None:
        return current_user.email or "Unknown student"
    return "Unknown student"


__all__ = ["router"]
