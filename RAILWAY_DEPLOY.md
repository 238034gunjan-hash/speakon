# Deploying Speak-On to Railway

Deploy this repo as two Railway services: one backend service and one frontend service.

## 1. Backend service

Create a Railway service from this repository with:

- Root Directory: `backend`
- Dockerfile Path: `Dockerfile`
- Start command: leave blank when using Docker, or use `gunicorn -w 4 -b 0.0.0.0:${PORT:-8080} app:app`

Set this Railway variable on the backend service:

- `GROQ_API_KEY`: your Groq API key

After deployment, copy the backend public URL from Railway, for example:

```text
https://your-backend-service.up.railway.app
```

## 2. Frontend service

Create a second Railway service from the same repository with:

- Root Directory: `frontend`
- Dockerfile Path: `Dockerfile`
- Start command: leave blank when using Docker

Set this Railway variable on the frontend service:

- `API_BASE_URL`: the backend public URL copied above

Example:

```text
API_BASE_URL=https://your-backend-service.up.railway.app
```

## What was fixed

The Railway crash was caused by `gunicorn==20.1.0` importing `pkg_resources`, which may be missing in modern Python environments. The requirements now use `gunicorn>=23.0.0` and also include `setuptools` as a fallback.

The backend now has its own `backend/requirements.txt`, and both backend start commands bind to Railway's `$PORT`.

The frontend Docker container now creates `config.js` at startup from `API_BASE_URL`, so the static frontend can call the separately deployed backend service.
