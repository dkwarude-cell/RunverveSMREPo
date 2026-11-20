FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY chatbot ./chatbot

# ADK's built-in API server; Cloud Run provides $PORT
CMD adk api_server --host 0.0.0.0 --port $PORT .