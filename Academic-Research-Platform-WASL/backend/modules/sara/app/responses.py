from typing import Any


def ok(data: Any = None):
    return {"success": True, "data": data}


def fail(message: str, code: str | None = None):
    payload: dict = {"success": False, "error": {"message": message}}
    if code:
        payload["error"]["code"] = code
    return payload
