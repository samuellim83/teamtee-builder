// Original, simple vector graphics for the front print. Colours come from the chosen inks.
import type { GraphicId } from "../lib/types";

interface Props { id: GraphicId; inks: string[]; size?: number; x?: number; y?: number }

export const GRAPHICS: { id: GraphicId; label: string }[] = [
  { id: "robot", label: "Robot" }, { id: "gear", label: "Gear" }, { id: "rocket", label: "Rocket" },
  { id: "bolt", label: "Bolt" }, { id: "star", label: "Star" }, { id: "chip", label: "Chip" },
  { id: "none", label: "No graphic" },
];

export function Graphic({ id, inks, size = 100, x = 0, y = 0 }: Props) {
  const a = inks[0] ?? "#FFFFFF";
  const b = inks[1] ?? a;
  const c = inks[2] ?? b;
  const s = size / 100;
  const t = `translate(${x} ${y}) scale(${s})`;
  switch (id) {
    case "robot":
      return (
        <g transform={t}>
          <line x1="50" y1="6" x2="50" y2="20" stroke={b} strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="6" r="6" fill={c} />
          <rect x="18" y="20" width="64" height="52" rx="12" fill={a} />
          <circle cx="37" cy="44" r="8" fill={b} /><circle cx="63" cy="44" r="8" fill={b} />
          <rect x="34" y="60" width="32" height="5" rx="2.5" fill={b} />
          <rect x="8" y="36" width="8" height="18" rx="4" fill={c} /><rect x="84" y="36" width="8" height="18" rx="4" fill={c} />
          <rect x="30" y="76" width="40" height="18" rx="6" fill={b} />
        </g>
      );
    case "gear": {
      const teeth = Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="43" y="2" width="14" height="22" rx="4" fill={a} transform={`rotate(${i * 45} 50 50)`} />
      ));
      return (
        <g transform={t}>
          {teeth}
          <circle cx="50" cy="50" r="34" fill={a} />
          <circle cx="50" cy="50" r="15" fill={b} />
          <circle cx="50" cy="50" r="7" fill={c === b ? a : c} />
        </g>
      );
    }
    case "rocket":
      return (
        <g transform={t}>
          <path d="M50 4 C70 20 74 46 68 70 L32 70 C26 46 30 20 50 4 Z" fill={a} />
          <circle cx="50" cy="36" r="9" fill={b} />
          <path d="M32 54 L16 76 L32 72 Z M68 54 L84 76 L68 72 Z" fill={b} />
          <path d="M40 72 L50 96 L60 72 Z" fill={c} />
        </g>
      );
    case "bolt":
      return (
        <g transform={t}>
          <circle cx="50" cy="50" r="46" fill={b === a ? "none" : b} stroke={a} strokeWidth={b === a ? 6 : 0} />
          <path d="M56 8 L24 56 L46 56 L40 92 L76 40 L54 40 Z" fill={a} />
        </g>
      );
    case "star":
      return (
        <g transform={t}>
          <path d="M50 4 L62 36 L96 38 L69 59 L79 93 L50 73 L21 93 L31 59 L4 38 L38 36 Z" fill={a} />
          <circle cx="50" cy="52" r="12" fill={b === a ? "none" : b} />
        </g>
      );
    case "chip":
      return (
        <g transform={t}>
          {[22, 38, 54, 70].map((p) => (
            <g key={p} fill={b}>
              <rect x={p} y="4" width="8" height="16" rx="2" /><rect x={p} y="80" width="8" height="16" rx="2" />
              <rect x="4" y={p} width="16" height="8" rx="2" /><rect x="80" y={p} width="16" height="8" rx="2" />
            </g>
          ))}
          <rect x="18" y="18" width="64" height="64" rx="10" fill={a} />
          <rect x="34" y="34" width="32" height="32" rx="6" fill={c === a ? b : c} />
        </g>
      );
    default:
      return null;
  }
}
