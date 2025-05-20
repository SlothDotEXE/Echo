from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import whisper, uvicorn, tempfile, shutil, os, asyncio, time
from concurrent.futures import ThreadPoolExecutor

ALLOWED = {"tiny", "base", "small", "medium", "large", "large-v2"}  # Add "turbo" if using whisper-cpp
_model_cache: dict[str, whisper.Whisper] = {}

def get_model(name: str = "base") -> whisper.Whisper:
    if name not in ALLOWED:
        raise ValueError(f"Invalid model: {name}")
    if name not in _model_cache:
        _model_cache[name] = whisper.load_model(name)
    return _model_cache[name]

app = FastAPI(title="Whisper API")  # Swagger UI and ReDoc enabled at /docs and /redoc
app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

executor = ThreadPoolExecutor()

# Rate limiting configuration: max 5 requests per 60-second window per client IP
RATE_LIMIT = 5
RATE_PERIOD = 60  # seconds
REQUEST_LOG: dict[str, list[float]] = {}

@app.post("/transcribe")
async def transcribe(request: Request,
                     file: UploadFile = File(...),
                     model_name: str = Form("base")):
    # Simple rate limiting check
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    if client_ip not in REQUEST_LOG:
        REQUEST_LOG[client_ip] = []
    # Remove timestamps outside the rate period
    REQUEST_LOG[client_ip] = [t for t in REQUEST_LOG[client_ip] if now - t < RATE_PERIOD]
    if len(REQUEST_LOG[client_ip]) >= RATE_LIMIT:
        return JSONResponse({"error": "Too many requests. Please try again later."}, status_code=429)
    REQUEST_LOG[client_ip].append(now)

    wav_path = None
    try:
        # Save uploaded file to a temporary location on disk
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            shutil.copyfileobj(file.file, tmp)
            wav_path = tmp.name

        # Load or retrieve the Whisper model (cached in memory)
        try:
            model = get_model(model_name)
        except ValueError as e:
            return JSONResponse({"error": str(e)}, status_code=400)

        # Run Whisper transcription in a thread to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(executor, model.transcribe, wav_path)

        # Return transcribed text **and** segments with timestamps
        return JSONResponse({"text": result["text"], "segments": result.get("segments", [])})
    finally:
        # Cleanup the temp file
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)

@app.get("/health")
def health():
    """Healthcheck endpoint."""
    return {"status": "ok"}

# Serve frontend build (if it exists) at root and /assets
if os.path.isdir("frontend_dist"):
    app.mount("/assets", StaticFiles(directory="frontend_dist/assets"), name="assets")
    @app.get("/")
    async def serve_index():
        return FileResponse("frontend_dist/index.html")

if __name__ == "__main__":
    # Run the app (with auto-reload for development)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
