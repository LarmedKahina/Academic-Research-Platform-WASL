import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.opportunity import Opportunity
from app.models.user import User

VALID_APPLICATION_STATUSES = {"pending", "accepted", "rejected"}
TERMINAL_APPLICATION_STATUSES = {"accepted", "rejected"}


def apply_to_opportunity(
    db: Session,
    opportunity_id: uuid.UUID,
    student_id: uuid.UUID,
    role: str,
    message: str | None = None,
) -> dict[str, object]:
    if role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can apply to opportunities",
        )

    opportunity = db.scalar(
        select(Opportunity)
        .where(Opportunity.id == opportunity_id)
        .with_for_update()
    )
    if opportunity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found",
        )

    if _deadline_has_passed(opportunity.deadline):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Opportunity deadline has passed",
        )

    existing_application = db.scalar(
        select(Application.id).where(
            Application.opportunity_id == opportunity_id,
            Application.student_id == student_id,
        )
    )
    if existing_application is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student has already applied to this opportunity",
        )

    application = Application(
        opportunity_id=opportunity_id,
        student_id=student_id,
        message=message,
        status="pending",
    )
    db.add(application)
    db.commit()

    application = _get_application_with_student(db, application.id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return _serialize_application(application)


def get_opportunity_applications(
    db: Session,
    opportunity_id: uuid.UUID,
    company_id: uuid.UUID,
    role: str,
    limit: int = 20,
    offset: int = 0,
) -> dict[str, object]:
    opportunity = _get_owned_opportunity(db, opportunity_id, company_id, role)

    total = db.scalar(
        select(func.count(Application.id)).where(Application.opportunity_id == opportunity.id)
    ) or 0
    applications = db.scalars(
        select(Application)
        .options(joinedload(Application.student))
        .where(Application.opportunity_id == opportunity.id)
        .order_by(Application.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return {
        "applications": [_serialize_application(application) for application in applications],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def update_application_status(
    db: Session,
    application_id: uuid.UUID,
    company_id: uuid.UUID,
    role: str,
    new_status: str,
) -> dict[str, object]:
    if new_status not in VALID_APPLICATION_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid application status",
        )

    application = db.scalar(
        select(Application)
        .options(
            joinedload(Application.student),
            joinedload(Application.opportunity),
        )
        .where(Application.id == application_id)
    )
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    _ensure_company_owner(application.opportunity, company_id, role)

    if application.status in TERMINAL_APPLICATION_STATUSES and application.status != new_status:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Accepted or rejected applications cannot change status",
        )

    if application.status == "pending" and new_status == "pending":
        return _serialize_application(application)

    application.status = new_status
    db.commit()
    db.refresh(application)
    return _serialize_application(application)


def _get_owned_opportunity(
    db: Session,
    opportunity_id: uuid.UUID,
    company_id: uuid.UUID,
    role: str,
) -> Opportunity:
    opportunity = db.get(Opportunity, opportunity_id)
    if opportunity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found",
        )

    _ensure_company_owner(opportunity, company_id, role)
    return opportunity


def _ensure_company_owner(opportunity: Opportunity, company_id: uuid.UUID, role: str) -> None:
    if role != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company users can manage opportunity applications",
        )
    if opportunity.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company users can only manage their own opportunities",
        )


def _deadline_has_passed(deadline: datetime | None) -> bool:
    if deadline is None:
        return False

    if deadline.tzinfo is None:
        return deadline < datetime.utcnow()

    return deadline < datetime.now(timezone.utc)


def _get_application_with_student(
    db: Session,
    application_id: uuid.UUID,
) -> Application | None:
    return db.scalar(
        select(Application)
        .options(joinedload(Application.student))
        .where(Application.id == application_id)
    )


def _serialize_application(application: Application) -> dict[str, object]:
    return {
        "id": application.id,
        "opportunity_id": application.opportunity_id,
        "student_id": application.student_id,
        "message": application.message,
        "status": application.status,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
        "student": _serialize_student(application.student),
    }


def _serialize_student(student: User | None) -> dict[str, object] | None:
    if student is None:
        return None

    return {
        "id": student.id,
        "name": student.full_name,
        "email": student.email,
        "avatar_url": student.avatar_url,
    }
