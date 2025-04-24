import { useState, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const MODELS = ["tiny", "base", "small", "medium", "large", "turbo"];
  const [model, setModel] = useState("base");

  // Theme toggling
const [theme, setTheme] = useState(
  () => localStorage.getItem("theme") || "light"
);

useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}, [theme]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    body.append("model", model);
    setLoading(true);

    const res = await fetch("http://localhost:8000/transcribe", {
      method: "POST",
      body,
    });
    const data = await res.json();
    setText(data.text);
    setLoading(false);
  }

  return (
    <main className="wrapper">
      <button
  onClick={() =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }
  style={{ marginBottom: "1rem" }}
>
  {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
</button>

      <h1>Whisper Transcriber</h1>

      <form onSubmit={handleSubmit}>
        {/* ── NEW ── model selector ───────── */}
  <label style={{marginBottom:"1rem"}}>
    Model&nbsp;
    <select value={model} onChange={e => setModel(e.target.value)}>
      {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  </label>
        <label className="upload">
          <input
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file ? file.name : "Choose an MP3"}
        </label>

        <button disabled={!file || loading}>
          {loading ? "Transcribing…" : "Transcribe"}
        </button>
      </form>

      {text && (
        <section className="output">
          <h2>Transcript</h2>
          <pre>{text}</pre>
        </section>
      )}
    </main>
  );
}
