import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";

const ACTIVE = ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
const LABEL = { CONFIRMED: "À préparer", PREPARING: "En préparation", READY: "Prête", OUT_FOR_DELIVERY: "En livraison" };
const TONE = { CONFIRMED: "warn", PREPARING: "warn", READY: "ok", OUT_FOR_DELIVERY: "ok" };
const fcfa = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
const hour = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

// Seule action possible pour la pharmacie à chaque étape. Pour une livraison, la remise appartient au livreur.
function nextAction(o) {
  if (o.status === "CONFIRMED") return { to: "PREPARING", text: "Commencer la préparation" };
  if (o.status === "PREPARING") return { to: "READY", text: "Marquer comme prête" };
  if (o.status === "READY" && o.fulfillment === "PICKUP") return { to: "COMPLETED", text: "Remettre au client" };
  return null;
}
const WAITING = { READY: "En attente d'un livreur", OUT_FOR_DELIVERY: "Le livreur est en route" };

export default function PharmacyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api("/orders/pharmacy?limit=100");
      setOrders(data.filter((o) => ACTIVE.includes(o.status)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  // La liste se met à jour toute seule toutes les 30 secondes.
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  async function advance(order, to) {
    setBusyId(order._id);
    setError("");
    try {
      await api(`/orders/${order._id}/status`, { method: "PATCH", body: { status: to } });
    } catch (err) {
      setError(errorText(err));
    } finally {
      await load();
      setBusyId(null);
    }
  }

  return (
    <section className="stack">
      <h1>Commandes à traiter</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {orders === null && !error && <p className="muted">Chargement…</p>}
      {orders && orders.length === 0 && (
        <p className="muted">Aucune commande à traiter pour le moment. La liste se met à jour toute seule.</p>
      )}

      <ul className="list">
        {(orders || []).map((o) => {
          const action = nextAction(o);
          const waiting = o.fulfillment === "DELIVERY" && WAITING[o.status];
          return (
            <li key={o._id} className={`card status-${TONE[o.status]}`}>
              <div className="row">
                <strong>Commande {o._id.slice(-6)}</strong>
                <span className={`tag ${TONE[o.status]}`}>{LABEL[o.status]}</span>
              </div>
              <span className="muted">{hour(o.createdAt)}</span>
              <ul className="items">
                {o.items.map((i) => <li key={i.medicine}>{i.quantity} × {i.name}</li>)}
              </ul>
              <span>
                {o.fulfillment === "PICKUP" ? "Retrait en pharmacie" : `Livraison : ${o.deliveryAddress}`}
                {o.fulfillment === "DELIVERY" && o.contactPhone && <> · <a href={`tel:${o.contactPhone}`}>{o.contactPhone}</a></>}
              </span>
              <span>Total payé : {fcfa(o.total)}</span>
              {action && (
                <button className="primary" disabled={busyId === o._id} onClick={() => advance(o, action.to)}>
                  {busyId === o._id ? "Un instant…" : action.text}
                </button>
              )}
              {waiting && <span className="hint">{WAITING[o.status]}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
