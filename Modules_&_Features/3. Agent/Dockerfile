FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PORT=8080

# 1. PyTorch CPU build (Cloud Run has no GPU; the CPU build is much smaller)
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2. Everything else
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. App code + trained models
COPY smartheal_agent/ ./smartheal_agent/
COPY models/ ./models/
COPY inference.py main.py ./

EXPOSE 8080

# Cloud Run injects $PORT (default 8080)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
