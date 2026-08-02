FROM node:22-slim AS node-runtime

FROM python:3.12-slim

ENV HOME=/tmp \
    XDG_CONFIG_HOME=/tmp \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
RUN node --version
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m yt_dlp --version
COPY server.py ./

USER 65532:65532
EXPOSE 10000
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 2 --timeout 300 --access-logfile - server:app"]
