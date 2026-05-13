"""Quick diagnostic: test DB + Supabase storage connections."""
import os
import re
import sys

# Make sure .env is loaded
os.chdir(os.path.dirname(os.path.abspath(__file__)))


def _mask_database_url(url: str) -> str:
    """Hide password in postgresql://user:pass@host for safe logging."""
    return re.sub(r"(postgresql://[^:]+:)[^@]+(@)", r"\1***\2", url, count=1, flags=re.I)

print("=" * 60)
print("  CONNECTION DIAGNOSTIC")
print("=" * 60)

# 1. Load settings
try:
    from app.config import settings
    print("\n[1] Settings loaded OK")
    print(f"    DATABASE_URL : {_mask_database_url(settings.database_url)}")
    print(f"    SUPABASE_URL : {settings.supabase_url}")
    print(f"    BUCKET       : {settings.supabase_storage_bucket}")
    print(f"    SERVICE_KEY  : {settings.supabase_service_key[:12]}...")
except Exception as e:
    print(f"\n[1] FAILED to load settings: {e}")
    sys.exit(1)

# 2. Test database connection
print("\n" + "-" * 60)
print("[2] Testing DATABASE connection...")
try:
    from app.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        val = result.scalar()
        print(f"    SELECT 1 = {val}")
        print("    [OK] Database connection OK")
except Exception as e:
    print(f"    [FAIL] Database connection FAILED: {e}")

# 3. Test Supabase storage connection
print("\n" + "-" * 60)
print("[3] Testing SUPABASE STORAGE connection...")
try:
    from supabase import create_client
    sb = create_client(settings.supabase_url, settings.supabase_service_key)
    bucket_ref = sb.storage.from_(settings.supabase_storage_bucket)
    result = bucket_ref.list(path="", options={"limit": 5})
    print(f"    Listed bucket OK, got {len(result)} items")
    print("    [OK] Supabase storage connection OK")
except Exception as e:
    print(f"    [FAIL] Supabase storage FAILED: {e}")

print("\n" + "=" * 60)
print("  DIAGNOSTIC COMPLETE")
print("=" * 60)
