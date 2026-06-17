# Stage 1: Build
FROM python:3.13-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PATH=/root/.local/bin:$PATH

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt
RUN python -m playwright install chromium --with-deps

# Stage 2: Runtime
FROM python:3.13-slim

WORKDIR /app

# Install runtime dependencies for psycopg2/asyncpg and playwright
RUN apt-get update && apt-get install -y \
    libpq5 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Add non-root user
RUN useradd -m -s /bin/bash masar
USER masar

# Copy dependencies from builder
COPY --from=builder /root/.local /home/masar/.local
COPY --from=builder /root/.cache/ms-playwright /home/masar/.cache/ms-playwright

ENV PATH=/home/masar/.local/bin:$PATH

COPY --chown=masar:masar . .
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
