# Echo

A minimal, fast, and modern web app for transcribing audio files using OpenAI’s Whisper models on your own GPU.

---
## Live Demo Screenshot

![UI screenshot](docs/echo.png)

---
## Features

- 🎙️ **Audio transcription:** Upload or drag-and-drop an audio file (mp3, wav, m4a, flac, ogg) and get instant transcriptions.
- 🚀 **Runs locally:** No cloud cost or privacy concerns—everything runs on your own GPU.
- 🌙 **Dark mode (default):** Toggleable dark/light theme for comfortable use.
- 🏷️ **Multi-model selection:** Pick from all major Whisper models (tiny, base, small, medium, large, etc.).
- 📦 **Drag-and-drop support:** Fast, easy, and intuitive uploads.
- 🧩 **Responsive UI:** Works well on desktop and mobile.
- 🔎 **Clear error handling:** Get helpful feedback if something goes wrong.
- 🧮 **Modern tech:** FastAPI backend, React frontend.

---

# Getting Started

## Prerequisites

- Python 3.9+ (with CUDA for GPU)
- Node.js (for frontend)

### Setup (Backend)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Setup (Frontend)

```bash
cd frontend
npm install
npm run dev
```

> By default, the frontend expects the backend at `http://localhost:8000`.

---

# API

## `POST /transcribe`

- **Body:** `multipart/form-data`
    - `file`: Audio file to transcribe
    - `model_name` (optional): Whisper model (`tiny`, `base`, etc.; default is `base`)
- **Response:**  
    - `{ "text": "Transcribed text..." }`
- **Errors:**  
    - `{ "error": "Descriptive message..." }`

---

# 🚀 Roadmap

## ✅ Completed

- [x] **Dark mode** as default, with toggle button.
- [x] **Multi-model selection** in UI and backend.
- [x] **Drag-and-drop** file upload support.
- [x] **Client-side file validation** (type/size).
- [x] **Async backend endpoint** with model caching for fast, concurrent requests.
- [x] **Clear inline error handling** for common issues.
- [x] **Responsive UI** for mobile/desktop.

## 🚧 Planned / Ideas

- [ ] Display timestamps and segments from transcription.
- [ ] Copy-to-clipboard button for results.
- [ ] Server-side rate limiting and abuse protection.
- [ ] Toast notifications for upload/result.
- [ ] Dockerization for simple deployment.
- [ ] Healthcheck endpoint for backend.
- [ ] API docs and improved usage guides.
- [ ] Automated tests.