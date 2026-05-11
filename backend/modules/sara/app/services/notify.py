import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Notification


def notify(
    db: Session,
    *,
    user_id: uuid.UUID,
    notif_type: str,
    content: str,
    link: str | None = None,
) -> None:
    db.add(
        Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            type=notif_type,
            content=content,
            read=False,
            link=link,
            created_at=datetime.now(timezone.utc),
        )
    )
