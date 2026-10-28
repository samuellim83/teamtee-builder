// AI helper: asks the server for slogan ideas, and falls back to built-in ideas if AI is unavailable.
import { useState } from "react";
import type { Design, SuggestRequest, SuggestResponse } from "../lib/types";
import { fallbackSlogans } from "../lib/fallback";

export function AIHelper({ design, onUse }: { design: Design; onUse: (slogan: string) => void }) {
  const [vibe, setVibe] = useState("school robotics club");
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [source, setSource] = useState<SuggestResponse["source"] | null>(null);

  async function ask() {
    setBusy(true);
    const body: SuggestRequest = { task: "slogans", teamName: design.teamName, graphic: design.graphic, vibe };
    try {
      const res = await fetch("/api/suggest", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SuggestResponse;
      if (!data.suggestions?.length) throw new Error("empty");
      setIdeas(data.suggestions); setSource(data.source);
    } catch {
      setIdeas(fallbackSlogans(design.teamName, design.graphic)); setSource("fallback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card ai" aria-labelledby="ai-h">
      <h2 id="ai-h">AI slogan helper</h2>
      <label className="field-label" htmlFor="vibe">Who is the shirt for?</label>
      <input id="vibe" className="text-input" value={vibe} maxLength={60} onChange={(e) => setVibe(e.target.value)} />
      <button className="primary-btn" onClick={ask} disabled={busy}>{busy ? "Thinking…" : "Suggest slogans"}</button>
      {ideas.length > 0 && (
        <>
          <ul className="ideas" aria-live="polite">
            {ideas.map((s) => (
              <li key={s}><button className="idea" onClick={() => onUse(s)} title="Put this on the back">{s}<span aria-hidden="true">＋</span></button></li>
            ))}
          </ul>
          <p className="tiny muted">
            {source === "ai" ? "Ideas from a small AI model. Tap one to put it on the back." : "AI is resting, so these are built-in ideas. Tap one to use it."}
          </p>
        </>
      )}
    </section>
  );
}
