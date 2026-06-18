#!/bin/sh
# Root start script used by Railpack to detect and run the backend service.
cd backend || exit 1

echo "Starting backend via gunicorn..."
exec gunicorn -w 4 -b 0.0.0.0:${PORT:-8080} app:app
