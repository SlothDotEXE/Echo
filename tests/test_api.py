import pytest
from fastapi.testclient import TestClient
from backend import main

# Dummy audio content for testing (not a real audio, but sufficient for file upload)
DUMMY_AUDIO = b"\x00\x00\x00\x00"

# Dummy model to replace actual Whisper model during tests
class DummyModel:
    def transcribe(self, audio_path):
        return {
            "text": "Hello world!",
            "segments": [
                {"start": 0.0, "end": 1.0, "text": "Hello world!"}
            ]
        }

def dummy_get_model(name="base"):
    return DummyModel()

def test_health_endpoint():
    client = TestClient(main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}

def test_transcribe_success(monkeypatch):
    # Patch the get_model to avoid loading real models
    monkeypatch.setattr(main, "get_model", dummy_get_model)
    client = TestClient(main.app)
    response = client.post("/transcribe",
                           files={"file": ("test.wav", DUMMY_AUDIO, "audio/wav")},
                           data={"model_name": "tiny"})
    assert response.status_code == 200
    data = response.json()
    assert data.get("text") == "Hello world!"
    assert "segments" in data and isinstance(data["segments"], list)
    # The dummy segment text should match
    assert data["segments"][0]["text"] == "Hello world!"

def test_invalid_model(monkeypatch):
    client = TestClient(main.app)
    # No monkeypatch here: use real get_model to trigger ValueError for invalid model
    response = client.post("/transcribe",
                           files={"file": ("test.wav", DUMMY_AUDIO, "audio/wav")},
                           data={"model_name": "invalid_model"})
    assert response.status_code == 400
    data = response.json()
    assert "error" in data and "Invalid model" in data["error"]

def test_rate_limiting(monkeypatch):
    # Patch get_model to dummy for faster execution
    monkeypatch.setattr(main, "get_model", dummy_get_model)
    client = TestClient(main.app)
    # Perform allowed number of requests
    for i in range(main.RATE_LIMIT):
        resp = client.post("/transcribe",
                           files={"file": ("test.wav", DUMMY_AUDIO, "audio/wav")},
                           data={"model_name": "base"})
        assert resp.status_code == 200
    # Next request should exceed rate limit
    resp = client.post("/transcribe",
                       files={"file": ("test.wav", DUMMY_AUDIO, "audio/wav")},
                       data={"model_name": "base"})
    assert resp.status_code == 429
    data = resp.json()
    assert "error" in data and "Too many requests" in data["error"]
    # Reset request log for other tests
    main.REQUEST_LOG.clear()
