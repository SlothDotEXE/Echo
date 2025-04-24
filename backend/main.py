from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import whisper, uvicorn, tempfile, shutil, os, uuid

ALLOWED = {"tiny","base","small","medium","large","large-v2","turbo"}  # turbo in whisper-cpp
_model_cache: dict[str, whisper.Whisper] = {}

def get_model(name: str = "base") -> whisper.Whisper:
    if name not in ALLOWED:
        raise ValueError(f"invalid model: {name}")
    if name not in _model_cache:
        _model_cache[name] = whisper.load_model(name)
    return _model_cache[name]

app = FastAPI(title="Whisper API", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form("base")        
):
    wav_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            shutil.copyfileobj(file.file, tmp)
            wav_path = tmp.name

        result = get_model(model).transcribe(wav_path)
        return JSONResponse({
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "model": model,
            "text": result["text"].strip()
        })
    finally:
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
