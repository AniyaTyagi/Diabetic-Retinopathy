# NetraX

AI diabetic retinopathy screening platform.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

- React + TypeScript + Vite + Tailwind
- Mock data (no backend yet)
- Routes via React Router — no top ScreenTabs
- Navigation: sidebar + screening CTAs

## Backend (Phase 1)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Docs: http://127.0.0.1:8000/docs
- Demo login: `arjun@netrax.health` / `netrax123`
- CNN / QML: stubs in `backend/app/ml` (integrate later)
- DB: set `DATABASE_URL` in `backend/.env` to your Neon Postgres URL (`postgresql+psycopg2://...?...sslmode=require`). SQLite remains the local default in `.env.example`.
