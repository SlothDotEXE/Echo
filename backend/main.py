from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import whisper, uvicorn, tempfile, shutil, os, uuid

MODEL = whisper.load_model("base")     # uses GPU automatically if available

app = FastAPI(title="Whisper API", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # vite dev server or prod domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # save to a temp file Whisper can open
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name

    result = MODEL.transcribe(path)
    os.unlink(path)  # tidy up

    return JSONResponse(
        {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "text": result["text"].strip(),
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
