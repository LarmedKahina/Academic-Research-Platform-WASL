from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.responses import ok
from app.routers import (
    auth,
    users,
    projects,
    ratings,
    datasets,
    papers,
    opportunities,
    notifications,
    applications,
    admin,
    saved_projects,
    reports,
)
from app.routers.comments import router_nested as comments_projects_router
from app.routers.comments import router_manage as comments_manage_router

app = FastAPI(title="WaslDZ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"success": True, "data": {"status": "ok"}}


@app.get("/health/db")
def health_db():
    """Verify DATABASE_URL can reach Postgres (use after changing .env)."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return ok({"database": "connected"})
    finally:
        db.close()


@app.exception_handler(OperationalError)
async def _db_operational(_: Request, exc: OperationalError):
    detail = str(getattr(exc, "orig", exc) or exc)
    return JSONResponse(
        status_code=503,
        content={
            "success": False,
            "error": {
                "message": "Database connection failed. Check DATABASE_URL in wasldz-backend/.env "
                "(use direct db.<ref>.supabase.co:5432 with the current database password).",
                "detail": detail[:500],
            },
        },
    )


for r in (
    auth.router,
    users.router,
    projects.router,
    ratings.router,
    comments_projects_router,
    comments_manage_router,
    datasets.router,
    papers.router,
    opportunities.router,
    notifications.router,
    applications.router,
    saved_projects.router,
    reports.router,
    admin.router,
):
    app.include_router(r)
