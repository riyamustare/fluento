FROM python:3.11-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y build-essential libpq-dev gcc curl && rm -rf /var/lib/apt/lists/*

COPY ./backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY ./backend /app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

RUN python manage.py collectstatic --noinput || true

ENV WORKER_COUNT=2

# Default command runs gunicorn. Use `docker run -e RUN_WORKER=true` to start worker script instead.
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
