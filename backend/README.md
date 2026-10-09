# NetraX Backend (Phase 1)

FastAPI REST API with SQLite. CNN / QML models are **stubs** — swap `app/ml` later.

## Setup

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env
```

### Database (Neon Postgres)

1. Open Neon → project → connection string.
2. In `backend/.env`, set:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Notes:
- Prefer `postgresql+psycopg2://...` (SQLAlchemy + `psycopg2-binary`).
- Keep `?sslmode=require`.
- On startup, tables are created / synced. No demo seed — register a user or use existing DB rows.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health

## Auth

Self-register creates a **Screening Operator**. Admins assign other roles via Users page / `PATCH /api/users/{id}/role`.

## RBAC

- Backend: `require_roles(...)` on sensitive APIs (`/users`, analytics, patients)
- Frontend: route guards + sidebar filter via `shared/rbac.ts` screen matrix

Use **Authorize** in Swagger with `/api/auth/token` (username = email).

## Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account → JWT |
| POST | `/api/auth/login` | JSON login → JWT |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/patients` | List / create patients |
| GET/POST | `/api/screenings` | List / create screenings |
| POST | `/api/screenings/{id}/images` | Upload OD/OS images |
| POST | `/api/screenings/{id}/analyze` | Run stub CNN/QML analysis |
| GET | `/api/screenings/{id}/results` | Get grading result |
| GET | `/api/reports` | Report list |
| GET | `/api/analytics/summary` | Dashboard-style counts |

## Later (Phase 2)

Replace stubs in `app/ml/__init__.py` (`run_cnn`, `run_qml`) with real model inference. API contracts stay the same.
