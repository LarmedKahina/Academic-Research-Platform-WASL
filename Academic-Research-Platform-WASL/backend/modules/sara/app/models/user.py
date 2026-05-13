from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, Text, DateTime, ARRAY, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_url: Mapped[str | None] = mapped_column(String(1024))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    student_profile: Mapped["StudentProfile | None"] = relationship(back_populates="user")
    professor_profile: Mapped["ProfessorProfile | None"] = relationship(back_populates="user")
    company_profile: Mapped["CompanyProfile | None"] = relationship(back_populates="user")


class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_url: Mapped[str] = mapped_column(String(1024))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    university: Mapped[str | None] = mapped_column(Text)
    department: Mapped[str | None] = mapped_column(Text)
    year: Mapped[str | None] = mapped_column(String(50))
    bio: Mapped[str | None] = mapped_column(Text)
    skills: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    github_url: Mapped[str | None] = mapped_column(String(512))
    linkedin_url: Mapped[str | None] = mapped_column(String(512))
    global_rank: Mapped[float | None] = mapped_column(Numeric(18, 4))
    total_views: Mapped[int | None] = mapped_column(Integer)
    total_downloads: Mapped[int | None] = mapped_column(Integer)
    avg_rating: Mapped[float | None] = mapped_column(Numeric(5, 2))

    user: Mapped[User] = relationship(back_populates="student_profile")


class ProfessorProfile(Base):
    __tablename__ = "professor_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    university: Mapped[str | None] = mapped_column(Text)
    department: Mapped[str | None] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(String(255))
    bio: Mapped[str | None] = mapped_column(Text)
    research_areas: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    total_supervised: Mapped[int | None] = mapped_column(Integer)
    avg_project_rating: Mapped[float | None] = mapped_column(Numeric(5, 2))

    user: Mapped[User] = relationship(back_populates="professor_profile")


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    company_name: Mapped[str | None] = mapped_column(Text)
    industry: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    website: Mapped[str | None] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text)
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    total_opportunities: Mapped[int | None] = mapped_column(Integer)

    user: Mapped[User] = relationship(back_populates="company_profile")
