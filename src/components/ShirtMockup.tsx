// Live SVG mockup of the shirt. Front and back views.
import type { Design } from "../lib/types";
import { Graphic } from "./Graphic";

const TEE = "M92 42 L122 28 Q150 50 178 28 L208 42 L262 76 L242 122 L214 108 L214 322 L86 322 L86 108 L58 122 L38 76 Z";
const HOODIE = "M92 42 L122 28 Q150 50 178 28 L208 42 L250 70 L284 250 L254 258 L218 128 L216 322 L84 322 L82 128 L46 258 L16 250 L50 70 Z";

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

export function ShirtMockup({ design, side }: { design: Design; side: "front" | "back" }) {
  const { garment, shirtColor } = design;
  const outline = isLight(shirtColor) ? "#9AA6B8" : "rgba(0,0,0,0.25)";
  const shade = isLight(shirtColor) ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const body = garment === "hoodie" ? HOODIE : TEE;
  const textInk = design.frontInks[design.frontInks.length - 1] ?? "#FFFFFF";
  const label =
    side === "front"
      ? `${design.teamName || "Blank"} ${garment} front`
      : `${garment} back: ${design.backStyle === "none" ? "blank" : design.backStyle}`;
  const firstMember = design.members.find((m) => m.name.trim()) ?? design.members[0];

  return (
    <svg viewBox="0 0 300 340" role="img" aria-label={`Mockup of the ${label}`} className="mockup-svg">
      {garment === "hoodie" && side === "back" && (
        <path d="M112 34 Q150 -6 188 34 Q150 70 112 34 Z" fill={shirtColor} stroke={outline} strokeWidth="2" />
      )}
      <path d={body} fill={shirtColor} stroke={outline} strokeWidth="2" strokeLinejoin="round" />
      <path d="M88 312 L212 312" stroke={outline} strokeWidth="1.2" strokeDasharray="4 4" />
      {side === "front" && garment === "tee" && <path d="M122 28 Q150 58 178 28" fill="none" stroke={outline} strokeWidth="3" />}
      {side === "front" && garment === "polo" && (
        <g>
          <path d="M122 28 L140 58 L150 40 L160 58 L178 28 Q150 44 122 28 Z" fill={shirtColor} stroke={outline} strokeWidth="2" />
          <path d="M150 44 L150 96" stroke={outline} strokeWidth="2" />
          <circle cx="150" cy="66" r="2.5" fill={outline} /><circle cx="150" cy="84" r="2.5" fill={outline} />
        </g>
      )}
      {side === "front" && garment === "hoodie" && (
        <g>
          <path d="M112 34 Q150 82 188 34" fill="none" stroke={outline} strokeWidth="3" />
          <path d="M106 236 L194 236 L204 296 L96 296 Z" fill={shade} stroke={outline} strokeWidth="1.5" />
          <line x1="138" y1="50" x2="136" y2="100" stroke={outline} strokeWidth="2" />
          <line x1="162" y1="50" x2="164" y2="100" stroke={outline} strokeWidth="2" />
        </g>
      )}
      {side === "front" && garment === "polo" ? (
        <>
          {design.graphic !== "none" && <Graphic id={design.graphic} inks={design.frontInks} size={34} x={168} y={92} />}
          {design.teamName && (
            <text x="185" y="142" textAnchor="middle" className="mock-text" fontSize="11" fill={textInk}>{design.teamName}</text>
          )}
        </>
      ) : side === "front" ? (
        <>
          {design.graphic !== "none" && <Graphic id={design.graphic} inks={design.frontInks} size={84} x={108} y={design.teamName ? 84 : 110} />}
          {design.teamName && (
            <text x="150" y={design.graphic === "none" ? 170 : 200} textAnchor="middle" className="mock-text"
              fontSize={design.teamName.length > 14 ? 17 : 22} fill={textInk}>{design.teamName.toUpperCase()}</text>
          )}
        </>
      ) : null}
      {side === "back" && design.backStyle === "team" && design.teamName && (
        <text x="150" y="120" textAnchor="middle" className="mock-text" fontSize="22" fill={design.backInk}>{design.teamName.toUpperCase()}</text>
      )}
      {side === "back" && design.backStyle === "slogan" && (
        <foreignObject x="80" y="90" width="140" height="80">
          <div className="mock-slogan" style={{ color: design.backInk }}>{design.slogan || "Your slogan here"}</div>
        </foreignObject>
      )}
      {side === "back" && design.backStyle === "names" && (
        <g>
          <text x="150" y="104" textAnchor="middle" className="mock-text" fontSize="18" fill={design.backInk}>
            {(firstMember?.name || "NAME").toUpperCase()}
          </text>
          <text x="150" y="190" textAnchor="middle" className="mock-num" fontSize="78" fill={design.backInk}>
            {firstMember?.number || "00"}
          </text>
        </g>
      )}
    </svg>
  );
}
