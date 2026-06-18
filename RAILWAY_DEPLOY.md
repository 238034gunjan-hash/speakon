# Deploying to Railway

This project contains two services you can deploy to Railway:

- Backend: `backend` (Python Flask app) — listens on port 5000
- Frontend: `frontend` (static site) — served on port 80

Recommended approach: create two Railway services (one for backend, one for frontend) and point each service to the corresponding Dockerfile (`backend/Dockerfile` and `frontend/Dockerfile`).

Steps (using Railway CLI):

1. Install Railway CLI: https://railway.app/docs/cli

2. From repo root, create or link a Railway project:

```bash
railway login
railway init
```

3. Backend service:

```bash
# Create a new service for the backend
railway link --project PROJECT_ID --service backend
# From the Railway dashboard, set the service's Dockerfile path to `backend/Dockerfile`
# Or run `railway up` from the repo root and choose the `backend` folder when prompted.
```

Environment variables:

- `GROQ_API_KEY` — required by `backend/services/translator.py`

Set env vars in the Railway dashboard for the backend service before deploying.

4. Frontend service:

```bash
# Create a new service for the frontend
railway link --project PROJECT_ID --service frontend
# Point the service to `frontend/Dockerfile` or choose static hosting and upload the `frontend/` directory
```

Notes:

- The backend Dockerfile exposes port 5000 and uses `gunicorn` to run the Flask app.
- The backend `requirements.txt` was converted to UTF-8 and includes `python-dotenv` so Railway secrets can be loaded during local testing; on Railway use the dashboard env settings.
- Make sure to add the `GROQ_API_KEY` (or whichever API key you use) in Railway service settings.
