// Tests for the AI endpoint, using a fake AI binding (no Cloudflare account needed).
import { describe, expect, it } from "vitest";
import worker from "./index";

function env(aiResult: unknown, fail = false) {
  return {
    AI: { run: async () => { if (fail) throw new Error("quota"); return aiResult; } },
    ASSETS: { fetch: async () => new Response("asset") },
  } as never;
}
const post = (body: unknown) =>
  new Request("https://x.dev/api/suggest", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const call = (req: Request, e: never) => (worker as { fetch: (r: Request, e: never) => Promise<Response> }).fetch(req, e);

describe("/api/suggest", () => {
  it("cleans the model's lines into a list of slogans", async () => {
    const res = await call(post({ task: "slogans", teamName: "Gear Up", graphic: "robot", vibe: "club" }),
      env({ response: "1. Built to Win\n- \"Gear Up Go!\"\n\nCode Together" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: ["Built to Win", "Gear Up Go!", "Code Together"], source: "ai" });
  });
  it("returns 503 when the AI is unavailable, so the app can fall back", async () => {
    const res = await call(post({ task: "slogans" }), env(null, true));
    expect(res.status).toBe(503);
  });
  it("rejects non-POST requests", async () => {
    const res = await call(new Request("https://x.dev/api/suggest"), env({}));
    expect(res.status).toBe(405);
  });
  it("passes other paths to the static app", async () => {
    const res = await call(new Request("https://x.dev/"), env({}));
    expect(await res.text()).toBe("asset");
  });
});
