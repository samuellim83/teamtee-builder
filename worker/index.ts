// Cloudflare Worker: serves /api/suggest using Workers AI. Everything else is the static app (./dist).
import type { SuggestRequest, SuggestResponse } from "../src/lib/types";

interface Env {
  AI: Ai;
  ASSETS: Fetcher;
}

const MODEL = "@cf/meta/llama-3.2-3b-instruct";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/suggest") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ error: "Use POST" }, 405);

    let input: SuggestRequest;
    try {
      input = (await request.json()) as SuggestRequest;
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    // Keep inputs short and plain so the prompt stays small and safe.
    const clean = (s: unknown, max: number) => String(s ?? "").replace(/[^\p{L}\p{N} ,.'&!-]/gu, "").slice(0, max);
    const teamName = clean(input.teamName, 24);
    const graphic = clean(input.graphic, 12);
    const vibe = clean(input.vibe, 60);

    try {
      const result = (await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: "You write short, positive, school-friendly T-shirt slogans. Reply with exactly 5 slogans, one per line, each under 6 words, no numbering, no quotes, no emojis." },
          { role: "user", content: `Team name: ${teamName || "not set"}. Shirt graphic: ${graphic}. Who it is for: ${vibe || "a school team"}.` },
        ],
        max_tokens: 120,
        temperature: 0.8,
      })) as { response?: string };
      const suggestions = (result.response ?? "")
        .split("\n")
        .map((l) => l.replace(/^[\s\d.\-*•"]+|["\s]+$/g, "").trim())
        .filter((l) => l.length > 2 && l.length <= 40)
        .slice(0, 5);
      if (!suggestions.length) return json({ error: "No suggestions" }, 502);
      const body: SuggestResponse = { suggestions, source: "ai" };
      return json(body);
    } catch {
      // Daily free allowance used up or model unavailable: the browser falls back to built-in ideas.
      return json({ error: "AI unavailable" }, 503);
    }
  },
} satisfies ExportedHandler<Env>;
