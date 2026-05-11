# Academic Project Sharing Platform Backend

FastAPI backend for the Person 3 modules:

- Ratings
- Comments
- Companies and opportunities
- Applications

The backend uses SQLAlchemy ORM with Supabase PostgreSQL. It does not create tables, run migrations, or modify the database schema. All tables must already exist in Supabase.

## Tech Stack

- FastAPI
- SQLAlchemy ORM
- Supabase PostgreSQL
- Supabase Auth JWT
- Uvicorn

## Project Structure

```text
backend/
  app/
    api/          # FastAPI routers and auth dependencies
    db/           # SQLAlchemy base and session setup
    models/       # ORM mappings to existing Supabase tables
    schemas/      # Pydantic request/response schemas
    services/     # Business logic
    main.py       # FastAPI app entrypoint
  requirements.txt
```

## Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file or set these environment variables in your deployment platform:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWT_SECRET=your-jwt-secret-if-using-HS256
```

`SUPABASE_JWT_SECRET` is only required for legacy HS256 JWT projects. For asymmetric JWTs, the backend validates tokens through the Supabase JWKS endpoint.

Run the API:

```bash
uvicorn app.main:app --reload
```

From the `backend` folder, the API docs are available at:

```text
http://127.0.0.1:8000/docs
```

## Authentication

All Person 3 endpoints require a Supabase Auth bearer token:

```http
Authorization: Bearer <supabase_access_token>
```

The JWT must include:

- `sub`: Supabase user id, matching `users.id`
- `email`: user email
- application role in one of:
  - `app_metadata.role`
  - `app_metadata.user_role`
  - `user_metadata.role`
  - `user_role`
  - `role`

Supported app roles:

- `student`
- `professor`
- `company`
- `admin`

## API Endpoints

### Ratings

```text
POST   /api/projects/{project_id}/ratings
GET    /api/projects/{project_id}/ratings
PUT    /api/ratings/{rating_id}
DELETE /api/ratings/{rating_id}
```

Rules:

- Students can rate projects.
- One rating per user per project.
- Owners can update their own rating.
- Owners and admins can delete ratings.
- `projects.avg_rating` and `projects.total_ratings` are maintained incrementally.

### Comments

```text
POST   /api/projects/{project_id}/comments
GET    /api/projects/{project_id}/comments
PUT    /api/comments/{comment_id}
DELETE /api/comments/{comment_id}
```

Rules:

- Students can comment on projects.
- Owners can edit/delete their own comments.
- Admins can delete comments.
- Comment listing supports pagination and includes basic user info.

### Companies and Opportunities

```text
GET    /api/companies
GET    /api/companies/{company_id}
GET    /api/companies/{company_id}/opportunities
POST   /api/companies/{company_id}/opportunities
```

Rules:

- Companies are represented by rows in `users` where `role = 'company'`.
- Company listing supports `industry` and `location` filters.
- Only a company user can create opportunities.
- Company users can only create opportunities for their own user id.

### Applications

```text
POST   /api/opportunities/{opportunity_id}/apply
GET    /api/opportunities/{opportunity_id}/applications
PUT    /api/applications/{application_id}/status
```

Rules:

- Only students can apply.
- Duplicate applications are blocked.
- Applications are blocked after the opportunity deadline.
- Only the owning company can view applications.
- Only the owning company can update application status.
- Valid statuses: `pending`, `accepted`, `rejected`.

## Supabase Database Contract

The backend expects these existing tables:

### users

Required columns:

- `id UUID PRIMARY KEY`
- `email TEXT/VARCHAR NOT NULL`
- `full_name TEXT/VARCHAR NULL`
- `role TEXT/VARCHAR NOT NULL`
- `avatar_url TEXT NULL`
- `industry TEXT/VARCHAR NULL`
- `location TEXT/VARCHAR NULL`
- `website TEXT/VARCHAR NULL`
- `description TEXT NULL`
- `created_at TIMESTAMPTZ NULL`
- `updated_at TIMESTAMPTZ NULL`

Recommended constraints/indexes:

- `email` unique
- `role` check: `student`, `professor`, `company`, `admin`
- index on `role`

### projects

Required columns:

- `id UUID PRIMARY KEY`
- `title TEXT/VARCHAR NOT NULL`
- `description TEXT NULL`
- `avg_rating NUMERIC(3,2) DEFAULT 0`
- `total_ratings INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NULL`
- `updated_at TIMESTAMPTZ NULL`

Recommended constraints:

- `total_ratings >= 0`
- `avg_rating BETWEEN 0 AND 5`

### ratings

Required columns:

- `id UUID PRIMARY KEY`
- `project_id UUID NOT NULL REFERENCES projects(id)`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `rating INTEGER NOT NULL`
- `created_at TIMESTAMPTZ NULL`
- `updated_at TIMESTAMPTZ NULL`

Required constraints/indexes:

- `UNIQUE(project_id, user_id)`
- `CHECK(rating BETWEEN 1 AND 5)`
- index on `project_id`
- index on `user_id`

### comments

Required columns:

- `id UUID PRIMARY KEY`
- `project_id UUID NOT NULL REFERENCES projects(id)`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `content TEXT NOT NULL`
- `created_at TIMESTAMPTZ NULL`
- `updated_at TIMESTAMPTZ NULL`

Recommended indexes:

- `comments(project_id, created_at DESC)`
- `comments(user_id)`

### opportunities

Required columns:

- `id UUID PRIMARY KEY`
- `company_id UUID NOT NULL REFERENCES users(id)`
- `title TEXT/VARCHAR NOT NULL`
- `description TEXT NOT NULL`
- `type TEXT/VARCHAR NULL`
- `skills TEXT[] NULL`
- `location TEXT/VARCHAR NULL`
- `deadline TIMESTAMPTZ NULL`
- `status TEXT/VARCHAR NOT NULL`
- `created_at TIMESTAMPTZ NULL`
- `updated_at TIMESTAMPTZ NULL`

Recommended indexes:

- `opportunities(company_id, created_at DESC)`
- `opportunities(status)`
- `opportunities(deadline)`

### applications

Required columns:

- `id UUID PRIMARY KEY`
- `opportunity_id UUID NOT NULL REFERENCES opportunities(id)`
- `student_id UUID NOT NULL REFERENCES users(id)`
- `cover_letter TEXT NULL`
- `resume_url TEXT NULL`
- `status TEXT/VARCHAR NOT NULL`
- `created_at TIMESTAMPTZ NULL`
- `updated_at TIMESTAMPTZ NULL`

Required constraints/indexes:

- `UNIQUE(opportunity_id, student_id)`
- `CHECK(status IN ('pending', 'accepted', 'rejected'))`
- index on `opportunity_id`
- index on `student_id`

## Production Notes

- Do not call `Base.metadata.create_all()`.
- Do not generate migrations for these existing tables.
- Keep Supabase schema and ORM mappings synchronized.
- Database-level unique constraints are required for hard concurrency safety.
- `projects.avg_rating` and `projects.total_ratings` are maintained by backend service logic.
