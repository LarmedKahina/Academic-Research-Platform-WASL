import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.auth import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def _http_error(status_code: int, message: str):
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "error": {"message": message}},
    )


def get_token_payload(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict | None:
    if not creds or not creds.credentials:
        return None
    return decode_token(creds.credentials)


def get_optional_user(
    payload: Annotated[dict | None, Depends(get_token_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    if not payload or "sub" not in payload:
        return None
    try:
        uid = uuid.UUID(str(payload["sub"]))
    except ValueError:
        return None
    return db.scalars(select(User).where(User.id == uid)).first()


def get_current_user(
    payload: Annotated[dict | None, Depends(get_token_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if not payload or "sub" not in payload:
        _http_error(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        uid = uuid.UUID(str(payload["sub"]))
    except ValueError:
        _http_error(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user = db.scalars(select(User).where(User.id == uid)).first()
    if not user:
        _http_error(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def get_verified_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Like get_current_user but also requires admin approval (verified=True).
    Admin accounts bypass this check since they are always considered verified.
    """
    if user.role != "admin" and not user.verified:
        _http_error(
            status.HTTP_403_FORBIDDEN,
            "Account pending admin approval. You will be able to perform this action once your account is verified.",
        )
    return user


def require_roles(*roles: str):
    def _inner(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            _http_error(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _inner


require_admin = require_roles("admin")
