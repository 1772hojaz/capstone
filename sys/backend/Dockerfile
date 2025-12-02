FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required to build some Python packages (psycopg, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libpq-dev \
       gcc \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install wheel/setuptools to avoid build issues
RUN python -m pip install --upgrade pip setuptools wheel

# Copy only requirements first for better caching
COPY requirements-web.txt /app/requirements-web.txt

# Install Python dependencies (web-only, lightweight)
RUN pip install --no-cache-dir -r /app/requirements-web.txt

# Copy application source
COPY . /app

# Expose port used by uvicorn
EXPOSE 8000

# Use shell form so $PORT is expanded at runtime by the container
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"
