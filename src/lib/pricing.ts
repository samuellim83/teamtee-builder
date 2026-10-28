// Pricing engine: turns a design and a quantity into a clear, explainable quote.
// All prices are ILLUSTRATIVE (USD) so the demo can teach how print pricing works.
import type { Design, Garment } from "./types";

export const GARMENT_PRICE: Record<Garment, number> = { tee: 15, polo: 28, hoodie: 55 };
export const GARMENT_LABEL: Record<Garment, string> = { tee: "T-shirt", polo: "Polo", hoodie: "Hoodie" };

// Screen printing: a one-off screen per ink colour, then a per-shirt cost per colour.
export const SCREEN_SETUP_PER_COLOUR = 40;
export const SCREEN_MIN_QTY = 12;
// Quantity breaks: [minimum quantity, price per colour per shirt]
export const SCREEN_BREAKS: [number, number][] = [
  [12, 3.0],
  [24, 2.2],
  [48, 1.6],
  [72, 1.2],
];

// Digital (DTG) printing: no setup, any number of colours, higher price per shirt.
export const DTG_BREAKS: [number, number][] = [
  [1, 18],
  [12, 15],
  [24, 12],
];

// Personalised names and numbers on the back (each shirt is different), per shirt.
export const NAMES_PER_SHIRT = 8;

export type Method = "screen" | "dtg";

export interface LocationQuote {
  location: "front" | "back";
  method: Method;
  colours: number;
  setup: number;      // one-off cost
  perShirt: number;   // cost per shirt for this location
}

export interface Quote {
  qty: number;
  garmentEach: number;
  locations: LocationQuote[];
  namesEach: number;
  setupTotal: number;
  perShirt: number;   // everything except setup, per shirt
  total: number;
  eachAllIn: number;  // total / qty
  notes: string[];    // plain-language explanations
}

export function breakPrice(breaks: [number, number][], qty: number): number {
  let price = breaks[0][1];
  for (const [min, p] of breaks) if (qty >= min) price = p;
  return price;
}

/** Cost of one print location by screen printing, or null when the quantity is too small. */
export function screenCost(colours: number, qty: number): { setup: number; perShirt: number } | null {
  if (qty < SCREEN_MIN_QTY || colours < 1) return null;
  return { setup: colours * SCREEN_SETUP_PER_COLOUR, perShirt: colours * breakPrice(SCREEN_BREAKS, qty) };
}

export function dtgCost(qty: number): { setup: number; perShirt: number } {
  return { setup: 0, perShirt: breakPrice(DTG_BREAKS, Math.max(qty, 1)) };
}

/** Choose the cheaper method for one location at this quantity. */
export function bestMethod(colours: number, qty: number): { method: Method; setup: number; perShirt: number } {
  const dtg = dtgCost(qty);
  const screen = screenCost(colours, qty);
  if (!screen) return { method: "dtg", ...dtg };
  const screenTotal = screen.setup + screen.perShirt * qty;
  const dtgTotal = dtg.setup + dtg.perShirt * qty;
  return screenTotal <= dtgTotal ? { method: "screen", ...screen } : { method: "dtg", ...dtg };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function quote(design: Design, qty: number): Quote {
  const q = Math.max(0, Math.floor(qty));
  const notes: string[] = [];
  const locations: LocationQuote[] = [];

  const frontHasPrint = design.graphic !== "none" || design.teamName.trim() !== "";
  if (frontHasPrint && q > 0) {
    const colours = Math.max(1, design.frontInks.length);
    const m = bestMethod(colours, q);
    locations.push({ location: "front", method: m.method, colours, setup: m.setup, perShirt: m.perShirt });
  }
  if ((design.backStyle === "team" || design.backStyle === "slogan") && q > 0) {
    const m = bestMethod(1, q);
    locations.push({ location: "back", method: m.method, colours: 1, setup: m.setup, perShirt: m.perShirt });
  }
  const namesEach = design.backStyle === "names" ? NAMES_PER_SHIRT : 0;

  const garmentEach = GARMENT_PRICE[design.garment];
  const setupTotal = locations.reduce((s, l) => s + l.setup, 0);
  const perShirt = garmentEach + namesEach + locations.reduce((s, l) => s + l.perShirt, 0);
  const total = q === 0 ? 0 : setupTotal + perShirt * q;

  for (const l of locations) {
    if (l.method === "screen") {
      notes.push(`${cap(l.location)}: screen printing, ${l.colours} ink ${plural(l.colours, "colour")} = ${l.colours} ${plural(l.colours, "screen")} to set up once.`);
    } else if (q < SCREEN_MIN_QTY) {
      notes.push(`${cap(l.location)}: digital (DTG) printing, because screen printing needs at least ${SCREEN_MIN_QTY} shirts.`);
    } else {
      notes.push(`${cap(l.location)}: digital (DTG) printing is cheaper than ${l.colours} screens at this quantity.`);
    }
  }
  if (namesEach) notes.push("Back: each name and number is different, so it is printed one shirt at a time.");

  return {
    qty: q, garmentEach, locations, namesEach,
    setupTotal: round2(setupTotal), perShirt: round2(perShirt), total: round2(total),
    eachAllIn: q ? round2(total / q) : 0, notes,
  };
}

export interface Saving {
  id: string;
  label: string;
  saves: number; // USD saved on the whole order (positive number)
}

/** Concrete, computed ways to lower the total. Sorted by biggest saving first. */
export function savings(design: Design, qty: number): Saving[] {
  const base = quote(design, qty);
  if (base.qty === 0) return [];
  const out: Saving[] = [];
  const add = (id: string, label: string, alt: Design) => {
    const t = quote(alt, qty).total;
    if (t < base.total - 0.005) out.push({ id, label, saves: round2(base.total - t) });
  };
  if (design.frontInks.length > 1) {
    add("fewer-inks", `Use ${design.frontInks.length - 1} front ink ${plural(design.frontInks.length - 1, "colour")} instead of ${design.frontInks.length}`,
      { ...design, frontInks: design.frontInks.slice(0, -1) });
  }
  if (design.backStyle === "names") add("team-back", "Print the team name on the back instead of individual names", { ...design, backStyle: "team" });
  if (design.backStyle !== "none") add("no-back", "Skip the back print", { ...design, backStyle: "none" });
  if (design.garment !== "tee") add("tee", "Choose T-shirts instead", { ...design, garment: "tee" });
  return out.sort((a, b) => b.saves - a.saves);
}

/** If ordering a few more shirts reaches a cheaper price break, say so. */
export function nextBreak(design: Design, qty: number): { atQty: number; eachAllIn: number; eachNow: number } | null {
  if (qty <= 0) return null;
  const thresholds = [...new Set([...SCREEN_BREAKS, ...DTG_BREAKS].map(([m]) => m))].filter((m) => m > qty).sort((a, b) => a - b);
  const now = quote(design, qty).eachAllIn;
  for (const t of thresholds) {
    if (t - qty > 12) break;
    const each = quote(design, t).eachAllIn;
    if (each < now - 0.005) return { atQty: t, eachAllIn: each, eachNow: now };
  }
  return null;
}

function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }
function plural(n: number, w: string) { return n === 1 ? w : w + "s"; }
