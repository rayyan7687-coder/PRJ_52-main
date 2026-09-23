BUILDLOOP QUICK README
======================

For the full verification and deployment checklist, read RUN_AND_DEPLOY.txt.

RUN IN VS CODE
--------------
Open this PRJ_52-main folder in VS Code. You need Python 3.11+ and Node.js 20+.
Use two VS Code terminals.

Terminal 1 - backend:

  cd backend
  py -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  Copy-Item .env.example .env
  alembic upgrade head
  python -m app.db.init_db
  uvicorn app.main:app --reload --port 8000

If activation is blocked, run this once in that terminal first:

  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Then visit http://localhost:8000/health and http://localhost:8000/api/v1/docs.

Terminal 2 - frontend:

  cd frontend-web
  npm install
  npm run dev

For live maps, create frontend-web/.env from frontend-web/.env.example and set
VITE_GOOGLE_MAPS_API_KEY. This is a browser key, so restrict it in Google Cloud
to your localhost and production frontend domains; never use a server key here.

Open the URL shown by Vite, normally http://localhost:3000.

VERIFY BEFORE DEPLOYMENT
------------------------
Run these from the relevant folders:

  backend:       pytest
  frontend-web:  npm run build
  frontend-web:  npm run lint

DEPLOYMENT SUMMARY
------------------
1. Create a managed PostgreSQL database. Do not use SQLite in production.
2. Deploy backend with root directory backend and start command:

  alembic upgrade head && python -m app.db.init_db && uvicorn app.main:app --host 0.0.0.0 --port $PORT

3. Set backend deployment variables:

  ENVIRONMENT=production
  SECRET_KEY=<a unique random secret, at least 32 characters>
  DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
  CORS_ORIGINS=https://<your-frontend-domain>

4. Deploy the frontend with root directory frontend-web and set:

  VITE_API_URL=https://<your-backend-domain>
  VITE_GOOGLE_MAPS_API_KEY=<browser key restricted to your frontend domain>

Do not add /api/v1 to VITE_API_URL. Do not commit .env files or secrets.
