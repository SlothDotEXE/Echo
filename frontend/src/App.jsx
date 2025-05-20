import React, { useState, useEffect, useRef } from "react";

const MODELS = [
  "tiny", "base", "small", "medium", "large", "large-v2"
];

export default function App() {
  const [file, setFile] = useState(null);
  const [model, setModel] = useState("base");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [segments, setSegments] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("");
  const inputRef = useRef();
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const showToast = (message, type) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMsg(message);
    setToastType(type);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg("");
      setToastType("");
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const validateFile = (f) => {
    const validTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/x-m4a", "audio/flac", "audio/ogg"];
    if (!validTypes.includes(f.type)) {
      showToast("Unsupported file type.", "error");
      setFile(null);
      return false;
    }
    if (f.size > 40 * 1024 * 1024) {
      showToast("File too large (max 40MB).", "error");
      setFile(null);
      return false;
    }
    setFile(f);
    showToast(`File ready: ${f.name}`, "success");
    return true;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    validateFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClickDropZone = () => {
    inputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult("");
    setSegments([]);
    if (!file) {
      showToast("Please select an audio file.", "error");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_name", model);

      const resp = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data?.error || "Transcription failed.");
      }
      const data = await resp.json();
      setResult(data.text);
      setSegments(data.segments || []);
    } catch (err) {
      showToast(err.message || "Unknown error.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      showToast("Copied transcription to clipboard.", "success");
    }
  };

  const formatTime = (sec) => {
    let minutes = Math.floor(sec / 60);
    const seconds = sec - minutes * 60;
    const hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = seconds.toFixed(1).padStart(4, '0');
    if (hours > 0) {
      return String(hours).padStart(2, '0') + ':' + minutesStr + ':' + secondsStr;
    } else {
      return minutesStr + ':' + secondsStr;
    }
  };

  return (
    <div className={`app-container${darkMode ? " dark" : ""}`}>
      <form
        onSubmit={handleSubmit}
        className="transcribe-form"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        autoComplete="off"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Echo Transcriber</h2>
          <button
            type="button"
            aria-label="Toggle dark mode"
            className="toggle-btn"
            onClick={() => setDarkMode(dm => !dm)}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>
        <label>
          <span>Model</span>
          <select value={model} onChange={e => setModel(e.target.value)}>
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        {/* Drag-and-drop zone */}
        <div
          className={`drop-zone${dragActive ? " active" : ""}`}
          onClick={handleClickDropZone}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === " " || e.key === "Enter") handleClickDropZone();
          }}
          aria-label="Click or drag file here to upload"
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            ref={inputRef}
            tabIndex={-1}
          />
          <span>
            {file
              ? `Selected: ${file.name}`
              : dragActive
                ? "Drop your audio file here…"
                : "Click or drag audio file here to upload"}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? "Transcribing..." : "Transcribe"}
        </button>
        {loading && (
          <div className="loading-spinner">
            <span className="spinner"></span>
            <span>Processing...</span>
          </div>
        )}
      </form>

      {result && (
        <div className="result-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Transcription</h3>
            <button 
              type="button" 
              className="toggle-btn" 
              onClick={handleCopy} 
              aria-label="Copy transcription to clipboard"
            >
              📋
            </button>
          </div>
          <pre>{result}</pre>
          {segments.length > 0 && (
            <div className="segments-list">
              {segments.map((seg, idx) => (
                <p key={idx}>
                  <strong>{formatTime(seg.start)} - {formatTime(seg.end)}:</strong> {seg.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {toastMsg && (
        <div className={`toast ${toastType}`}>{toastMsg}</div>
      )}

      {/* Styling for dark/light mode, drag-drop, and layout */}
      <style>{`
        :root {
          --bg: #f6f8fa;
          --card-bg: #fff;
          --text: #1e293b;
          --accent: #2563eb;
          --error-bg: #fee2e2;
          --error-text: #b91c1c;
          --shadow: 0 2px 16px #0001;
          --drop-border: #cbd5e1;
          --drop-bg: #f1f5f9;
          --drop-active-bg: #e0e7ef;
        }
        body.dark, .app-container.dark {
          --bg: #18181b;
          --card-bg: #23232a;
          --text: #e0e7ef;
          --accent: #3b82f6;
          --error-bg: #4b1d1d;
          --error-text: #fecaca;
          --shadow: 0 2px 20px #0004;
          --drop-border: #334155;
          --drop-bg: #18181b;
          --drop-active-bg: #282a36;
        }
        body, .app-container {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          margin: 0;
          transition: background 0.2s, color 0.2s;
        }
        .app-container {
          display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px;
        }
        .transcribe-form {
          background: var(--card-bg);
          color: var(--text);
          padding: 32px;
          border-radius: 16px;
          box-shadow: var(--shadow);
          max-width: 400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .transcribe-form h2 {
          margin: 0 0 8px 0; font-weight: 700; font-size: 1.4em;
        }
        .transcribe-form label {
          font-weight: 500; display: flex; flex-direction: column; gap: 4px;
        }
        .transcribe-form select {
          margin-top: 4px; border-radius: 8px; padding: 6px;
          border: 1px solid #e5e7eb; background: var(--bg); color: var(--text);
        }
        .drop-zone {
          background: var(--drop-bg);
          border: 2px dashed var(--drop-border);
          border-radius: 10px;
          padding: 24px 8px;
          text-align: center;
          cursor: pointer;
          color: var(--text);
          margin-bottom: 4px;
          font-size: 1.03em;
          outline: none;
          transition: background 0.2s, border-color 0.2s;
        }
        .drop-zone.active {
          background: var(--drop-active-bg);
          border-color: var(--accent);
        }
        .submit-btn {
          margin-top: 10px; padding: 12px 0;
          border: none; border-radius: 8px;
          background: var(--accent); color: #fff;
          font-weight: 600; font-size: 1.1em;
          cursor: pointer;
          transition: background 0.18s;
        }
        .submit-btn:disabled {
          background: #60a5fa; cursor: not-allowed;
        }
        .toggle-btn {
          background: none; border: none; font-size: 1.35em; cursor: pointer;
          margin-left: 10px; transition: color 0.15s;
          color: var(--accent);
        }
        .loading-spinner {
          display: flex; flex-direction: row; align-items: center; gap: 8px; margin-top: 8px;
          color: var(--accent);
        }
        .spinner {
          width: 20px; height: 20px;
          border: 3px solid #93c5fd;
          border-top: 3px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        .result-card {
          margin-top: 32px;
          background: var(--card-bg);
          color: var(--text);
          padding: 24px;
          border-radius: 16px;
          box-shadow: var(--shadow);
          max-width: 600px;
          width: 100%;
        }
        .result-card h3 {
          font-weight: 600; margin-bottom: 10px;
        }
        .result-card pre {
          white-space: pre-wrap; word-break: break-word;
          font-size: 1.08em; line-height: 1.5;
        }
        .segments-list { margin-top: 12px; }
        .segments-list p { margin: 4px 0; }
        .segments-list strong { color: var(--accent); }
        .toast {
          position: fixed; bottom: 20px; left: 50%;
          transform: translateX(-50%);
          background: var(--card-bg); color: var(--text);
          padding: 12px 20px; border-radius: 8px;
          box-shadow: var(--shadow);
        }
        .toast.success {
          background: #d1fae5; color: #065f46;
        }
        .toast.error {
          background: var(--error-bg); color: var(--error-text);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 500px) {
          .transcribe-form { padding: 18px; border-radius: 12px; }
          .result-card { padding: 12px; border-radius: 10px; }
        }
      `}</style>
    </div>
  );
}
