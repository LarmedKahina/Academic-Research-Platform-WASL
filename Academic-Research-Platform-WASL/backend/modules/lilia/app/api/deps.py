import os
import uuid
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    email: str | None
    role: str
    claims: dict[str, Any]


def get_current_user(token: str | None = Depends(oauth2_scheme)) -> CurrentUser:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = _decode_supabase_jwt(token)
    user_id = _extract_user_id(claims)

    return CurrentUser(
        id=user_id,
        email=claims.get("email"),
        role=_extract_application_role(claims),
        claims=claims,
    )


def get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
) -> CurrentUser | None:
    if not token:
        return None

    return get_current_user(token)


def _decode_supabase_jwt(token: str) -> dict[str, Any]:
    supabase_url = _required_env("SUPABASE_URL").rstrip("/")
    issuer = f"{supabase_url}/auth/v1"
    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")

    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")
        if not algorithm:
            raise InvalidTokenError("Missing JWT algorithm")

        if algorithm.startswith("HS"):
            signing_key = _required_env("SUPABASE_JWT_SECRET")
            allowed_algorithms = [algorithm]
        else:
            signing_key = _get_jwks_client(supabase_url).get_signing_key_from_jwt(token).key
            allowed_algorithms = ["ES256", "RS256"]

        return jwt.decode(
            token,
            signing_key,
            algorithms=allowed_algorithms,
            audience=audience,
            issuer=issuer,
            options={
                "require": ["exp", "iat", "sub", "iss"],
            },
        )
    except (InvalidTokenError, PyJWKClientError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@lru_cache(maxsize=1)
def _get_jwks_client(supabase_url: str) -> PyJWKClient:
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True)


def _extract_user_id(claims: dict[str, Any]) -> uuid.UUID:
    raw_user_id = claims.get("sub") or claims.get("user_id")
    if not raw_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return uuid.UUID(str(raw_user_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def _extract_application_role(claims: dict[str, Any]) -> str:
    app_metadata = claims.get("app_metadata") or {}
    user_metadata = claims.get("user_metadata") or {}

    role = (
        app_metadata.get("role")
        or app_metadata.get("user_role")
        or claims.get("user_role")
        or user_metadata.get("role")
        or claims.get("role")
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return str(role)


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{name} environment variable is required",
        )

    return value
