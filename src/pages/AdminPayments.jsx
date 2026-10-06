import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import { useRun } from "../admin.js";

const fcfa = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
const when = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const METHODS = { WAVE: "Wave", ORANGE_MONEY: "Orange Money", FREE_MONEY: "Free Money", CARD: "Carte bancaire" };
const ORDER_LABEL = { EXPIRED: "commande expirée", CANCELLED: "commande annulée" };

export default function AdminPayments() {
  const [items, setItems] = useState(null);
  const [toReviewOnly, setToReviewOnly] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api(`/admin/payments?limit=100&needsReview=${toReviewOnly}`);
      setItems(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [toReviewOnly]);
  useEffect(() => { load(); }, [load]);

  const { busy, error, notice, run } = useRun(load);

  function refund(p) {
    const reason = window.prompt(`Rembourser ${fcfa(p.amount)} au client ? Motif (5 caractères minimum) :`);
    if (reason === null) return;
    run(() => api(`/admin/payments/${p.id}/refund`, { method: "POST", body: { reason: reason.trim() } }), "Paiement remboursé.");
  }

  return (
    <section className="stack">
      <h1>Paiements</h1>
      <label className="inline">
        <input type="checkbox" checked={toReviewOnly} onChange={(e) => setToReviewOnly(e.target.checked)} />
        Seulement ceux à traiter
      </label>

      {loadError && <p role="alert" className="error">{loadError}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="ok-text">{notice}</p>}
      {items && items.length === 0 && <p className="muted">{toReviewOnly ? "Aucun paiement à traiter." : "Aucun paiement."}</p>}

      <ul className="list">
        {(items || []).map((p) => {
          const refunded = p.status === "REFUNDED";
          const refundable = p.status === "PAID" && (p.orderStatus === "EXPIRED" || p.orderStatus === "CANCELLED");
          const tone = refunded ? "ok" : p.needsReview ? "bad" : "warn";
          return (
            <li key={p.id} className={`card status-${tone}`}>
              <div className="row">
                <strong>{fcfa(p.amount)} · {METHODS[p.method] || p.method}</strong>
                <span className={`tag ${tone}`}>{refunded ? "Remboursé" : p.needsReview ? "À traiter" : p.status}</span>
              </div>
              <span className="muted">Commande {String(p.orderId).slice(-6)}{ORDER_LABEL[p.orderStatus] ? ` : ${ORDER_LABEL[p.orderStatus]}` : ""} · payé le {p.paidAt ? when(p.paidAt) : "-"}</span>
              {p.refundReason && <span className="hint">Motif : {p.refundReason}</span>}
              {refundable && <div><button className="primary" disabled={busy} onClick={() => refund(p)}>Rembourser</button></div>}
              {p.status === "PAID" && !refundable && <span className="hint">La commande est encore active : la pharmacie doit d'abord l'annuler.</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
