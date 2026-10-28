// Live price: total, price per shirt, what drives the cost, and computed ways to save.
import type { Design } from "../lib/types";
import { GARMENT_LABEL, nextBreak, quote, savings } from "../lib/pricing";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const rm = (n: number) => usd.format(n);

export function PricePanel({ design, onApplySaving }: { design: Design; onApplySaving: (id: string) => void }) {
  const qty = design.members.length;
  const q = quote(design, qty);
  const nb = nextBreak(design, qty);
  const tips = savings(design, qty).slice(0, 3);

  return (
    <section className="card price" aria-labelledby="price-h">
      <h2 id="price-h">Live price</h2>
      {qty === 0 ? (
        <p className="muted">Add shirts in the Team step to see a price.</p>
      ) : (
        <>
          <div className="price-big" aria-live="polite">
            <span className="price-each">{rm(q.eachAllIn)}</span>
            <span className="price-each-label">per shirt, all in</span>
          </div>
          <p className="price-total">{rm(q.total)} for {qty} shirt{qty === 1 ? "" : "s"}</p>

          <ul className="breakdown" aria-label="Price breakdown">
            <li><span>{GARMENT_LABEL[design.garment]}</span><span>{rm(q.garmentEach)} each</span></li>
            {q.locations.map((l) => (
              <li key={l.location}>
                <span>{l.location === "front" ? "Front" : "Back"} print ({l.method === "screen" ? `screen, ${l.colours} ink${l.colours > 1 ? "s" : ""}` : "digital"})</span>
                <span>{rm(l.perShirt)} each</span>
              </li>
            ))}
            {q.namesEach > 0 && <li><span>Names and numbers</span><span>{rm(q.namesEach)} each</span></li>}
            {q.setupTotal > 0 && <li><span>Screen setup (once)</span><span>{rm(q.setupTotal)}</span></li>}
          </ul>

          {nb && (
            <p className="nudge">
              Add <strong>{nb.atQty - qty}</strong> more shirt{nb.atQty - qty === 1 ? "" : "s"} to reach {nb.atQty} and pay <strong>{rm(nb.eachAllIn)}</strong> each instead of {rm(nb.eachNow)}.
            </p>
          )}

          {tips.length > 0 && (
            <div className="savings">
              <h3>Make it cheaper</h3>
              <ul>
                {tips.map((t) => (
                  <li key={t.id}>
                    <button className="saving" onClick={() => onApplySaving(t.id)}>
                      <span>{t.label}</span><span className="saving-amt">save {rm(t.saves)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="learn">
            <summary>Why does it cost this much?</summary>
            <ul>{q.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            <p className="small muted">Screen printing makes one stencil (screen) for each ink colour, so fewer colours and bigger orders lower the price per shirt. Digital printing has no setup, which suits small orders and full-colour art.</p>
          </details>
          <p className="tiny muted">Illustrative prices for this demo.</p>
        </>
      )}
    </section>
  );
}
