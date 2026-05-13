"""
Create or update the platform admin account (Kahina Larmed / ENSIA).

Run from repository root or from this folder:

  cd backend/modules/sara
  set SEED_ADMIN_PASSWORD=YourSecurePassword
  ..\\..\\venv\\Scripts\\python.exe scripts\\seed_admin.py

The script is idempotent: if the email already exists, it sets role to admin,
updates the display name, and resets the password to SEED_ADMIN_PASSWORD.
"""
from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SARA_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SARA_ROOT)
os.chdir(SARA_ROOT)

ADMIN_EMAIL = "kahina.larmed@ensia.edu.dz"
ADMIN_NAME = "Kahina Larmed"


def main() -> None:
    pwd = (os.environ.get("SEED_ADMIN_PASSWORD") or "").strip()
    if not pwd or len(pwd) < 8:
        print("Set SEED_ADMIN_PASSWORD in the environment to a strong password (8+ chars), then re-run.")
        sys.exit(1)

    from sqlalchemy import select

    from app.database import SessionLocal
    from app.models import User
    from app.services.auth import hash_password

    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        u = db.scalars(select(User).where(User.email == ADMIN_EMAIL.lower())).first()
        if u:
            u.name = ADMIN_NAME
            u.role = "admin"
            u.verified = True
            u.password_hash = hash_password(pwd)
            u.updated_at = now
            db.commit()
            print(f"Updated existing user {ADMIN_EMAIL} → admin, name={ADMIN_NAME}")
        else:
            db.add(
                User(
                    id=uuid.uuid4(),
                    email=ADMIN_EMAIL.lower(),
                    password_hash=hash_password(pwd),
                    name=ADMIN_NAME,
                    role="admin",
                    verified=True,
                    created_at=now,
                    updated_at=now,
                )
            )
            db.commit()
            print(f"Created admin {ADMIN_EMAIL} ({ADMIN_NAME})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
