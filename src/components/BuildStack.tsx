// The block stack: each step is a coloured block that snaps into place.
// The open block shows its controls; closed blocks show what was chosen.
import { useState } from "react";
import type { BackStyle, Design, Garment, Size } from "../lib/types";
import { SIZES } from "../lib/types";
import { INK_COLOURS, SHIRT_COLOURS, makeMembers } from "../lib/state";
import { GARMENT_LABEL } from "../lib/pricing";
import { GRAPHICS, Graphic } from "./Graphic";

export const STEPS = [
  { key: "shirt", title: "Shirt", hint: "Pick the garment and colour" },
  { key: "front", title: "Front", hint: "Graphic, team name and inks" },
  { key: "back", title: "Back", hint: "Team name, slogan or names" },
  { key: "team", title: "Team", hint: "How many, and which sizes" },
  { key: "order", title: "Order", hint: "Check and send to the print shop" },
] as const;

interface Props {
  design: Design;
  update: (patch: Partial<Design>) => void;
  active: number;
  setActive: (i: number) => void;
  done: Set<number>;
  snap: (i: number) => void;
  orderPanel: React.ReactNode;
}

export function BuildStack({ design, update, active, setActive, done, snap, orderPanel }: Props) {
  return (
    <ol className="stack" aria-label="Build steps">
      {STEPS.map((step, i) => {
        const open = i === active;
        return (
          <li key={step.key} className={`block block-${step.key} ${open ? "is-open" : ""} ${done.has(i) ? "is-done" : ""}`}>
            <button className="block-head" onClick={() => setActive(i)} aria-expanded={open} aria-controls={`panel-${step.key}`}>
              <span className="block-num" aria-hidden="true">{done.has(i) ? "✓" : i + 1}</span>
              <span className="block-title">{step.title}</span>
              <span className="block-summary">{open ? step.hint : summary(step.key, design)}</span>
            </button>
            {open && (
              <div className="block-body" id={`panel-${step.key}`}>
                {step.key === "shirt" && <ShirtStep design={design} update={update} />}
                {step.key === "front" && <FrontStep design={design} update={update} />}
                {step.key === "back" && <BackStep design={design} update={update} />}
                {step.key === "team" && <TeamStep design={design} update={update} />}
                {step.key === "order" && orderPanel}
                {step.key !== "order" && (
                  <button className="snap-btn" onClick={() => snap(i)}>Snap it in <span aria-hidden="true">↓</span></button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function summary(key: string, d: Design): string {
  switch (key) {
    case "shirt": return `${colourName(d.shirtColor, SHIRT_COLOURS)} ${GARMENT_LABEL[d.garment]}`;
    case "front": return `${d.graphic === "none" ? "No graphic" : GRAPHICS.find((g) => g.id === d.graphic)?.label}${d.teamName ? `, "${d.teamName}"` : ""}, ${d.frontInks.length} ink${d.frontInks.length > 1 ? "s" : ""}`;
    case "back": return { none: "Blank back", team: "Team name", slogan: d.slogan ? `"${d.slogan}"` : "Slogan", names: "Names and numbers" }[d.backStyle];
    case "team": return `${d.members.length} shirt${d.members.length === 1 ? "" : "s"}`;
    default: return "Review and send";
  }
}

function colourName(hex: string, list: { name: string; hex: string }[]) {
  return list.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? "Custom";
}

type StepProps = { design: Design; update: (p: Partial<Design>) => void };

function Swatches({ list, value, onPick, label }: { list: { name: string; hex: string }[]; value: string; onPick: (hex: string) => void; label: string }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {list.map((c) => (
        <button key={c.hex} role="radio" aria-checked={c.hex === value} aria-label={c.name} title={c.name}
          className="swatch" style={{ background: c.hex }} onClick={() => onPick(c.hex)} />
      ))}
    </div>
  );
}

function ShirtStep({ design, update }: StepProps) {
  return (
    <>
      <p className="field-label">Garment</p>
      <div className="chips" role="radiogroup" aria-label="Garment">
        {(Object.keys(GARMENT_LABEL) as Garment[]).map((g) => (
          <button key={g} role="radio" aria-checked={design.garment === g} className="chip" onClick={() => update({ garment: g })}>
            {GARMENT_LABEL[g]}
          </button>
        ))}
      </div>
      <p className="field-label">Shirt colour</p>
      <Swatches list={SHIRT_COLOURS} value={design.shirtColor} onPick={(hex) => update({ shirtColor: hex })} label="Shirt colour" />
    </>
  );
}

function FrontStep({ design, update }: StepProps) {
  const toggleInk = (hex: string) => {
    const has = design.frontInks.includes(hex);
    if (has && design.frontInks.length === 1) return; // keep at least one ink
    if (!has && design.frontInks.length >= 4) return;  // at most four
    update({ frontInks: has ? design.frontInks.filter((c) => c !== hex) : [...design.frontInks, hex] });
  };
  return (
    <>
      <p className="field-label">Graphic</p>
      <div className="tiles" role="radiogroup" aria-label="Front graphic">
        {GRAPHICS.map((g) => (
          <button key={g.id} role="radio" aria-checked={design.graphic === g.id} className="tile" onClick={() => update({ graphic: g.id })}>
            {g.id === "none" ? <span className="tile-none">None</span> : (
              <svg viewBox="0 0 100 100" aria-hidden="true"><Graphic id={g.id} inks={["#1C2541", "#F6B83F", "#2EC4D6"]} /></svg>
            )}
            <span className="tile-label">{g.label}</span>
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="teamName">Team name</label>
      <input id="teamName" className="text-input" value={design.teamName} maxLength={24}
        placeholder="e.g. Gear Up" onChange={(e) => update({ teamName: e.target.value })} />
      <p className="field-label">Ink colours <span className="muted">({design.frontInks.length} of 4, each colour is one screen)</span></p>
      <div className="swatches" role="group" aria-label="Front ink colours">
        {INK_COLOURS.map((c) => {
          const on = design.frontInks.includes(c.hex);
          return (
            <button key={c.hex} aria-pressed={on} aria-label={c.name} title={c.name}
              className={`swatch ink ${on ? "on" : ""}`} style={{ background: c.hex }} onClick={() => toggleInk(c.hex)} />
          );
        })}
      </div>
    </>
  );
}

function BackStep({ design, update }: StepProps) {
  const opts: { v: BackStyle; label: string }[] = [
    { v: "none", label: "Blank" }, { v: "team", label: "Team name" }, { v: "slogan", label: "Slogan" }, { v: "names", label: "Names + numbers" },
  ];
  return (
    <>
      <p className="field-label">Back print</p>
      <div className="chips" role="radiogroup" aria-label="Back print">
        {opts.map((o) => (
          <button key={o.v} role="radio" aria-checked={design.backStyle === o.v} className="chip" onClick={() => update({ backStyle: o.v })}>{o.label}</button>
        ))}
      </div>
      {design.backStyle === "slogan" && (
        <>
          <label className="field-label" htmlFor="slogan">Slogan <span className="muted">(or ask the AI helper for ideas)</span></label>
          <input id="slogan" className="text-input" value={design.slogan} maxLength={40} placeholder="e.g. Built to Compete"
            onChange={(e) => update({ slogan: e.target.value })} />
        </>
      )}
      {design.backStyle === "names" && <p className="muted small">Add each name and number in the Team step.</p>}
      {design.backStyle !== "none" && (
        <>
          <p className="field-label">Back ink</p>
          <Swatches list={INK_COLOURS} value={design.backInk} onPick={(hex) => update({ backInk: hex })} label="Back ink colour" />
        </>
      )}
    </>
  );
}

function TeamStep({ design, update }: StepProps) {
  const [showRoster, setShowRoster] = useState(design.backStyle === "names");
  const count = (s: Size) => design.members.filter((m) => m.size === s).length;
  const change = (s: Size, delta: number) => {
    if (delta > 0) update({ members: [...design.members, ...makeMembers(s, 1)] });
    else {
      const idx = design.members.map((m) => m.size).lastIndexOf(s);
      if (idx >= 0) update({ members: design.members.filter((_, i) => i !== idx) });
    }
  };
  const editMember = (id: string, patch: Partial<{ name: string; number: string; size: Size }>) =>
    update({ members: design.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  return (
    <>
      <p className="field-label">Sizes <span className="muted">({design.members.length} shirts)</span></p>
      <div className="sizes">
        {SIZES.map((s) => (
          <div key={s} className="size">
            <span className="size-label">{s}</span>
            <div className="stepper">
              <button aria-label={`Remove one ${s}`} onClick={() => change(s, -1)} disabled={count(s) === 0}>−</button>
              <output aria-live="polite">{count(s)}</output>
              <button aria-label={`Add one ${s}`} onClick={() => change(s, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <button className="link-btn" onClick={() => setShowRoster((v) => !v)} aria-expanded={showRoster}>
        {showRoster ? "Hide" : "Show"} team list {design.backStyle === "names" ? "(names and numbers)" : ""}
      </button>
      {showRoster && (
        <div className="roster">
          {design.members.length === 0 && <p className="muted small">Add sizes above to start the list.</p>}
          {design.members.map((m, i) => (
            <div className="roster-row" key={m.id}>
              <span className="roster-i">{i + 1}</span>
              <input aria-label={`Name for shirt ${i + 1}`} placeholder="Name" maxLength={14} value={m.name}
                onChange={(e) => editMember(m.id, { name: e.target.value })} />
              <input aria-label={`Number for shirt ${i + 1}`} placeholder="No." maxLength={3} inputMode="numeric" value={m.number}
                onChange={(e) => editMember(m.id, { number: e.target.value.replace(/\D/g, "") })} />
              <select aria-label={`Size for shirt ${i + 1}`} value={m.size} onChange={(e) => editMember(m.id, { size: e.target.value as Size })}>
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
