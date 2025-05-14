from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import whisper, uvicorn, tempfile, shutil, os
from concurrent.futures import ThreadPoolExecutor
import asyncio

ALLOWED = {"tiny", "base", "small", "medium", "large", "large-v2"}  # Add "turbo" if using whisper-cpp
_model_cache: dict[str, whisper.Whisper] = {}

def get_model(name: str = "base") -> whisper.Whisper:
    if name not in ALLOWED:
        raise ValueError(f"Invalid model: {name}")
    if name not in _model_cache:
        _model_cache[name] = whisper.load_model(name)
    return _model_cache[name]

app = FastAPI(title="Whisper API", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

executor = ThreadPoolExecutor()

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    model_name: str = Form("base")   # Accepts "model_name" from form-data, defaults to "base"
):
    wav_path = None
    try:
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            shutil.copyfileobj(file.file, tmp)
            wav_path = tmp.name

        # Get the model (cached, loads only if not already in memory)
        try:
            model = get_model(model_name)
        except ValueError as e:
            return JSONResponse({"error": str(e)}, status_code=400)

        # Run whisper transcription in threadpool (to not block event loop)
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(executor, model.transcribe, wav_path)

        return JSONResponse({"text": result["text"]})
    finally:
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
