// Final step: summary, share link, team chat message and a printable job ticket.
import { useState } from "react";
import type { Design } from "../lib/types";
import { SIZES } from "../lib/types";
import { GARMENT_LABEL, quote } from "../lib/pricing";
import { GRAPHICS } from "./Graphic";
import { shareUrl } from "../lib/state";
import { rm } from "./PricePanel";

export function OrderPanel({ design }: { design: Design }) {
  const [copied, setCopied] = useState<string | null>(null);
  const q = quote(design, design.members.length);
  const sizeLine = SIZES.map((s) => [s, design.members.filter((m) => m.size === s).length] as const)
    .filter(([, n]) => n > 0).map(([s, n]) => `${s} ×${n}`).join(", ");

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); }
    catch { setCopied("Copy failed: select and copy the text manually"); }
    setTimeout(() => setCopied(null), 2500);
  };

  const chatMsg = `Hi team! Here's our ${GARMENT_LABEL[design.garment].toLowerCase()} design for ${design.teamName || "our team"}: ${shareUrl(design)}\nPrice: about ${rm(q.eachAllIn)} each. Please check your name and size by Friday.`;

  return (
    <div className="order">
      <dl className="summary">
        <div><dt>Garment</dt><dd>{GARMENT_LABEL[design.garment]}</dd></div>
        <div><dt>Front</dt><dd>{GRAPHICS.find((g) => g.id === design.graphic)?.label}{design.teamName ? `, "${design.teamName}"` : ""} ({design.frontInks.length} ink{design.frontInks.length > 1 ? "s" : ""})</dd></div>
        <div><dt>Back</dt><dd>{{ none: "Blank", team: "Team name", slogan: `"${design.slogan}"`, names: "Names and numbers" }[design.backStyle]}</dd></div>
        <div><dt>Sizes</dt><dd>{sizeLine || "None yet"}</dd></div>
        <div><dt>Total</dt><dd><strong>{rm(q.total)}</strong> ({rm(q.eachAllIn)} each)</dd></div>
      </dl>
      <div className="order-actions">
        <button className="primary-btn" onClick={() => copy(shareUrl(design), "Design link copied")}>Copy design link</button>
        <button className="secondary-btn" onClick={() => copy(chatMsg, "Team chat message copied")}>Copy team chat message</button>
        <button className="secondary-btn" onClick={() => window.print()}>Print job ticket</button>
      </div>
      <p className="tiny muted" role="status">{copied ?? "This demo doesn't place real orders. The job ticket is what a print shop would receive."}</p>
    </div>
  );
}
