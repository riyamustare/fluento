# Deployment Guide (Render backend + Vercel frontend)

This document explains how to deploy the backend (Django + FastAPI helpers) to Render and the frontend (Vite + React) to Vercel.

## Required environment variables

Backend (Render)
- `DATABASE_URL` - PostgreSQL connection string provided by Render Postgres addon
- `DJANGO_SECRET_KEY` - Django SECRET_KEY
- `DJANGO_DEBUG` - `False` in production
- `DJANGO_ALLOWED_HOSTS` - comma separated list, e.g. `your-app.onrender.com`
- `REDIS_URL` - Redis URL for RQ worker (Render Redis or external)
- `ASSEMBLYAI_API_KEY` - AssemblyAI key
- `GEMINI_API_KEY` - Google Gemini API key (or equivalent)

Frontend (Vercel)
- `VITE_API_BASE_URL` - URL of the backend API (e.g. `https://s2s-backend.onrender.com`)

## Backend (Render) - quick steps
1. Create a new Web Service on Render, link repository. Use the `backend` folder as the root.
2. Set the build command to: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
3. Set the start command to: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
4. Add environment variables listed above.
5. Add a Postgres database service on Render, copy its `DATABASE_URL` into your service env.
6. Add a Redis service (Render's Redis addon) and set `REDIS_URL`.
7. Optionally enable the worker service (render.yaml includes a worker section) to run the RQ worker.

## Frontend (Vercel) - quick steps
1. On Vercel, import the frontend directory and set the framework to Vite/React.
2. Add environment variable `VITE_API_BASE_URL` pointing to your backend.
3. Deploy.

## Worker and scaling
- The repository includes an RQ worker scaffold. The worker requires `REDIS_URL`.
- Start RQ worker: `rq worker default` (the repo includes `fastapi_service/worker-start.sh` used by Render worker service)
- Scale web/woker services on Render to handle increased load. For heavy AI usage, consider horizontal autoscaling and rate-limiting.

## Notes on performance
- External APIs (AssemblyAI/Gemini) are the main latency and cost drivers. Offload them to background workers and return job ids to frontend.
- Use `CONN_MAX_AGE` for DB pooling (configured in settings).
- Use Redis for caching and session storage if needed.

