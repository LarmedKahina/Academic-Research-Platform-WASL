import unicodedata
import uuid
import re

from app.config import settings
from supabase import create_client


def upload_file_to_bucket(
    *,
    folder_prefix: str,
    filename: str,
    content_type: str,
    data: bytes,
) -> tuple[str, str]:
    bucket = settings.supabase_storage_bucket
    # Normalize unicode characters and remove accents
    normalized = unicodedata.normalize("NFKD", filename)
    # Keep only ASCII alphanumeric, dots, underscores, hyphens
    safe_name = "".join(c for c in normalized if c.isascii() and (c.isalnum() or c in "._-"))
    # Further sanitise: lowercase and replace any remaining disallowed characters with underscore
    safe_name = safe_name.lower()
    safe_name = re.sub(r"[^a-z0-9._-]", "_", safe_name)
    if not safe_name:
        safe_name = "file.bin"
    path = f"{folder_prefix.strip('/')}/{uuid.uuid4()}_{safe_name}"

    sb = create_client(settings.supabase_url, settings.supabase_service_key)

    bucket_ref = sb.storage.from_(bucket)
    bucket_ref.upload(path, data, file_options={"content-type": content_type, "cache-control": "86400"})
    signed = bucket_ref.get_public_url(path)
    url: str | None = None
    if isinstance(signed, str):
        url = signed
    elif isinstance(signed, dict):
        url = (
            signed.get("publicUrl")
            or signed.get("publicURL")
            or signed.get("public_url")
            or signed.get("data", {}).get("publicUrl")
        )
    elif hasattr(signed, "public_url"):
        url = signed.public_url
    if not url:
        url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{path}"
    return url, path


def delete_file_from_bucket(file_key: str | None) -> None:
    if not file_key:
        return
    sb = create_client(settings.supabase_url, settings.supabase_service_key)
    bucket_ref = sb.storage.from_(settings.supabase_storage_bucket)
    try:
        bucket_ref.remove([file_key])
    except Exception:
        # Best-effort delete; row removal still proceeds
        pass
