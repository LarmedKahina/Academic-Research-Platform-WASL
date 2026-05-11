from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    applications,
    comments,
    companies,
    opportunities,
    projects,
    notifications,
    ratings,
    saved_projects,
)

app = FastAPI(title="Academic Project Sharing Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ratings.router, prefix="/api", tags=["Ratings"])
app.include_router(comments.router, prefix="/api", tags=["Comments"])
app.include_router(saved_projects.router, prefix="/api", tags=["Saved Projects"])
app.include_router(companies.router, prefix="/api", tags=["Companies"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(opportunities.router, prefix="/api", tags=["Opportunities"])
app.include_router(applications.router, prefix="/api", tags=["Applications"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
