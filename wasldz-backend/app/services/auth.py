from datetime import datetime, timedelta, timezone

import bcrypt
import hashlib
from jose import JWTError, jwt

from app.config import settings

JWT_ALG = "HS256"
TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    sha256_hash = hashlib.sha256(pwd_bytes).hexdigest().encode('utf-8')
    hashed = bcrypt.hashpw(sha256_hash, bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = plain.encode('utf-8')
    
    # Backward compatibility for passwords hashed without pre-hashing
    try:
        if bcrypt.checkpw(pwd_bytes, hashed.encode('utf-8')):
            return True
    except ValueError:
        pass
        
    sha256_hash = hashlib.sha256(pwd_bytes).hexdigest().encode('utf-8')
    try:
        return bcrypt.checkpw(sha256_hash, hashed.encode('utf-8'))
    except ValueError:
        return False


def create_access_token(*, subject: str, role: str, verified: bool) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {
            "sub": subject,
            "role": role,
            "verified": verified,
            "exp": expire,
        },
        settings.secret_key,
        algorithm=JWT_ALG,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[JWT_ALG])
    except JWTError:
        return None
