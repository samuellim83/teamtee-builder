import { useEffect, useMemo, useState } from "react";
import type { Design } from "./lib/types";
import { SIZES } from "./lib/types";
import { DEFAULT_DESIGN, designFromHash, loadDraft, saveDraft } from "./lib/state";
import { GARMENT_LABEL, quote } from "./lib/pricing";
import { BuildStack, STEPS } from "./components/BuildStack";
import { ShirtMockup } from "./components/ShirtMockup";
import { PricePanel, rm } from "./components/PricePanel";
import { AIHelper } from "./components/AIHelper";
import { OrderPanel } from "./components/OrderPanel";

export default function App() {
  // A shared link wins over a saved draft, which wins over the default design.
  const [design, setDesign] = useState<Design>(() => designFromHash(window.location.hash) ?? loadDraft() ?? DEFAULT_DESIGN);
  const [active, setActive] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [side, setSide] = useState<"front" | "back">("front");
  const [justSnapped, setJustSnapped] = useState(false);

  useEffect(() => saveDraft(design), [design]);
  // Show the side of the shirt that matches the open step.
  useEffect(() => setSide(STEPS[active].key === "back" ? "back" : "front"), [active]);

  const update = (patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch }));
  const q = useMemo(() => quote(design, design.members.length), [design]);

  const snap = (i: number) => {
    setDone((s) => new Set(s).add(i));
    setActive(Math.min(i + 1, STEPS.length - 1));
    setJustSnapped(true);
    setTimeout(() => setJustSnapped(false), 450);
    // Bring the next block into view (helps most on phones).
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => document.querySelector(".block.is-open")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 60);
  };

  const applySaving = (id: string) => {
    if (id === "fewer-inks") update({ frontInks: design.frontInks.slice(0, -1) });
    if (id === "team-back") update({ backStyle: "team" });
    if (id === "no-back") update({ backStyle: "none" });
    if (id === "tee") update({ garment: "tee" });
  };

  const startOver = () => {
    if (window.confirm("Start a new design? Your current one will be cleared.")) {
      setDesign(DEFAULT_DESIGN); setDone(new Set()); setActive(0);
      history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <div>
            <h1>TeamTee Builder</h1>
            <p className="tagline">Snap blocks together to design your team shirt.</p>
          </div>
        </div>
        <button className="ghost-btn" onClick={startOver}>New design</button>
      </header>

      <main className="layout">
        <section className="col-build" aria-label="Design steps">
          <BuildStack design={design} update={update} active={active} setActive={setActive} done={done} snap={snap}
            orderPanel={<OrderPanel design={design} />} />
        </section>

        <section className={`col-preview ${justSnapped ? "snapped" : ""}`} aria-label="Shirt preview">
          <div className="plate">
            <ShirtMockup design={design} side={side} />
          </div>
          <div className="side-toggle" role="radiogroup" aria-label="Shirt side">
            {(["front", "back"] as const).map((s) => (
              <button key={s} role="radio" aria-checked={side === s} onClick={() => setSide(s)}>{s === "front" ? "Front" : "Back"}</button>
            ))}
          </div>
        </section>

        <aside className="col-side">
          <PricePanel design={design} onApplySaving={applySaving} />
          <AIHelper design={design} onUse={(slogan) => { update({ backStyle: "slogan", slogan }); setSide("back"); }} />
        </aside>
      </main>

      <div className="mobile-bar" aria-hidden="true">
        <span>{design.members.length} shirts</span>
        <strong>{rm(q.total)}</strong>
      </div>

      <footer className="foot">
        Demo by Samuel Lim Wei Howe. Inspired by years of teaching robotics through hands-on, block-based building. Prices are illustrative.
      </footer>

      <JobTicket design={design} />
    </div>
  );
}

/** Only visible when printing: the job ticket a print shop would receive. */
function JobTicket({ design }: { design: Design }) {
  const q = quote(design, design.members.length);
  return (
    <section className="ticket" aria-hidden="true">
      <h1>Job ticket: {design.teamName || "Team order"}</h1>
      <div className="ticket-grid">
        <div className="ticket-mock"><ShirtMockup design={design} side="front" /></div>
        <div className="ticket-mock"><ShirtMockup design={design} side="back" /></div>
      </div>
      <p><strong>Garment:</strong> {GARMENT_LABEL[design.garment]}, colour {design.shirtColor}</p>
      <p><strong>Front inks:</strong> {design.frontInks.join(", ")}</p>
      <p><strong>Back:</strong> {design.backStyle} {design.backStyle === "slogan" ? `("${design.slogan}")` : ""}</p>
      <p><strong>Sizes:</strong> {SIZES.map((s) => `${s}: ${design.members.filter((m) => m.size === s).length}`).join("  ")}</p>
      {design.backStyle === "names" && (
        <table>
          <thead><tr><th>#</th><th>Name</th><th>No.</th><th>Size</th></tr></thead>
          <tbody>{design.members.map((m, i) => <tr key={m.id}><td>{i + 1}</td><td>{m.name}</td><td>{m.number}</td><td>{m.size}</td></tr>)}</tbody>
        </table>
      )}
      <p><strong>Quote:</strong> {rm(q.total)} ({rm(q.eachAllIn)} each). {q.notes.join(" ")}</p>
    </section>
  );
}
