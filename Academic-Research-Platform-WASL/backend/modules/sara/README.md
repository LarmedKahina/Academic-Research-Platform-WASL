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

### Windows / IPv4: `db.<ref>.supabase.co` does not resolve

Supabase **direct** Postgres (`db.<ref>.supabase.co:5432`) is **IPv6-first**. Many home or office networks cannot resolve or route it, which shows up as **“could not translate host name”** or similar DNS errors.

**Fix:** use the **Session pooler** URI instead (Supabase **Connect** → **Session pooler**). Host looks like `aws-0-<aws-region>.pooler.supabase.com` on port **5432**. Paste the full URI into `DATABASE_URL` (the region in the hostname must match your project).

Verify with `python test_connections.py` or `GET /health/db`.

### “Tenant or user not found” or `password authentication failed`

- **Tenant or user not found** on the pooler: wrong **AWS region** in the pooler hostname, or wrong project routing. Copy the Session pooler string from the dashboard instead of guessing the region.
- **Password authentication failed**: the password in `DATABASE_URL` does not match the **Database password** in Supabase (**Settings → Database** — reset it there if unsure).

With `SUPABASE_URL` set, the app rewrites plain user `postgres` to **`postgres.<project-ref>`** on `*.pooler.supabase.com` hosts (see `app/database.py`). You can still paste the exact URI Supabase shows (often already includes `postgres.<ref>` in the username).

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
