# WaslDZ Backend

FastAPI service for the WaslDZ academic project sharing platform.

## Setup

1. Create a virtual environment and install dependencies:

```bash
cd wasldz-backend
venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

2. Copy environment variables into `wasldz-backend/.env`. Required keys:

- `DATABASE_URL` — Supabase Postgres URI from **Dashboard → Project Settings → Database**.
- `SUPABASE_URL` — `https://<project-ref>.supabase.co` (used to fix pooler usernames and for storage).
- `SECRET_KEY` — long random string (e.g. a 64-character hex secret).
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE` — service role key for Storage.
- `SUPABASE_STORAGE_BUCKET` — e.g. `wasldz-files`

### “Tenant or user not found” on port 6543

The **transaction pooler** expects the DB user **`postgres.<your-project-ref>`**, not plain `postgres`. The app rewrites the URL automatically when `SUPABASE_URL` is set. Alternatively use the **direct** connection string (host `db.<ref>.supabase.co`, port **5432**) from the same Supabase page. Optional: set `SUPABASE_PROJECT_REF=<ref>` if you cannot set `SUPABASE_URL`.

## Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

- Interactive docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

## Create the first admin

After the server is running:

```json
POST http://localhost:8000/api/auth/register
Content-Type: application/json
```

Use multipart if you include a verification file; for a minimal JSON-only register you can use the `multipart/form-data` fields `email`, `password`, `name`, `role` (same as the signup form), or call `register` with role `admin` via Swagger (form fields).

Example JSON shape for tools that send form data:

- `email`: `admin@wasldz.dz`
- `password`: `Admin1234`
- `name`: `Platform Admin`
- `role`: `admin`

Then in **Supabase → Table Editor → users**, find this user and set `verified` to `true` so the account is fully active immediately.

## Frontend

Run the React app from `wasldz-frontend` with `npm install` and `npm run dev`. In development, leave `VITE_API_URL` unset so `/api` is proxied to this backend.
