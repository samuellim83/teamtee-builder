// App state helpers: defaults, share links and saving drafts in the browser.
import type { Design, Member, Size } from "./types";

export const SHIRT_COLOURS = [
  { name: "Navy", hex: "#1D3557" }, { name: "White", hex: "#FFFFFF" }, { name: "Black", hex: "#1B1B1F" },
  { name: "Sky", hex: "#4EA8DE" }, { name: "Grass", hex: "#2E9E5B" }, { name: "Sun", hex: "#F7C548" },
  { name: "Tomato", hex: "#E4572E" }, { name: "Grape", hex: "#6C4AB6" },
];

export const INK_COLOURS = [
  { name: "White", hex: "#FFFFFF" }, { name: "Black", hex: "#111111" }, { name: "Gold", hex: "#F6B83F" },
  { name: "Red", hex: "#E63946" }, { name: "Cyan", hex: "#2EC4D6" }, { name: "Lime", hex: "#A7D930" },
  { name: "Navy", hex: "#1D3557" }, { name: "Pink", hex: "#FF7AB6" },
];

let counter = 0;
export const newId = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export function makeMembers(size: Size, n: number): Member[] {
  return Array.from({ length: n }, () => ({ id: newId(), name: "", number: "", size }));
}

export const DEFAULT_DESIGN: Design = {
  garment: "tee",
  shirtColor: "#1D3557",
  graphic: "robot",
  teamName: "Gear Up",
  frontInks: ["#FFFFFF", "#F6B83F"],
  backStyle: "none",
  slogan: "",
  backInk: "#FFFFFF",
  members: [...makeMembers("S", 4), ...makeMembers("M", 6), ...makeMembers("L", 4)],
};

// ---- Share links: the whole design lives in the URL after "#d=" ----
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function shareUrl(design: Design): string {
  const url = new URL(window.location.href);
  url.hash = "d=" + toBase64Url(JSON.stringify(design));
  return url.toString();
}

/** Read a design from the URL, checking every field so a broken link can't crash the app. */
export function designFromHash(hash: string): Design | null {
  const m = hash.match(/d=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    return sanitize(JSON.parse(fromBase64Url(m[1])));
  } catch {
    return null;
  }
}

function sanitize(x: unknown): Design | null {
  if (!x || typeof x !== "object") return null;
  const d = x as Partial<Design>;
  const hex = (v: unknown, fb: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fb);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  return {
    garment: d.garment === "polo" || d.garment === "hoodie" ? d.garment : "tee",
    shirtColor: hex(d.shirtColor, DEFAULT_DESIGN.shirtColor),
    graphic: (["robot", "gear", "rocket", "bolt", "star", "chip", "none"] as const).includes(d.graphic as never) ? d.graphic! : "robot",
    teamName: str(d.teamName, 24),
    frontInks: Array.isArray(d.frontInks) && d.frontInks.length ? d.frontInks.slice(0, 4).map((c) => hex(c, "#FFFFFF")) : ["#FFFFFF"],
    backStyle: (["none", "team", "slogan", "names"] as const).includes(d.backStyle as never) ? d.backStyle! : "none",
    slogan: str(d.slogan, 40),
    backInk: hex(d.backInk, "#FFFFFF"),
    members: Array.isArray(d.members)
      ? d.members.slice(0, 200).map((m) => ({
          id: newId(),
          name: str((m as Member)?.name, 14),
          number: str((m as Member)?.number, 3),
          size: (sizes.includes((m as Member)?.size) ? (m as Member).size : "M") as Size,
        }))
      : [],
  };
}

// ---- Draft saved in this browser (optional; the app works without it) ----
const KEY = "teamtee-draft-v1";
export function loadDraft(): Design | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function saveDraft(design: Design) {
  try {
    localStorage.setItem(KEY, JSON.stringify(design));
  } catch {
    /* storage blocked: ignore */
  }
}
