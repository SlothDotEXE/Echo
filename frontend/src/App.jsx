import { useState, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

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
