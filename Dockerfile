# Stage 1: Build the React frontend
FROM node:18 AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/. .
RUN npm run build

# Stage 2: Build the Python backend and combine with frontend
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies (ffmpeg for audio decoding, git for Whisper)
RUN apt-get update && apt-get install -y ffmpeg git && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install (includes FastAPI, Uvicorn, Whisper)
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Install PyTorch (CPU version by default; for GPU, use appropriate CUDA base image and torch build)
RUN pip install torch

# Copy backend code and frontend build artifacts
COPY backend/. ./backend
COPY --from=frontend-build /app/dist ./frontend_dist

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
