import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorText } from "../api.js";

export const STATUS = {
  PAYMENT_PENDING: ["En attente de paiement", "warn"],
  CONFIRMED: ["Payée, en attente de préparation", "warn"],
  PREPARING: ["En préparation", "warn"],
  READY: ["Prête", "ok"],
  OUT_FOR_DELIVERY: ["En livraison", "ok"],
  COMPLETED: ["Terminée", "ok"],
  CANCELLED: ["Annulée", "bad"],
  EXPIRED: ["Expirée", "bad"]
};
export const fcfa = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
const when = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders/mine?limit=50")
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(errorText(err)));
  }, []);

  return (
    <section className="stack">
      <h1>Mes commandes</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {orders === null && !error && <p className="muted">Chargement…</p>}
      {orders && orders.length === 0 && (
        <p className="muted">Vous n'avez pas encore de commande. <Link to="/rechercher">Rechercher un médicament</Link></p>
      )}
      <ul className="list">
        {(orders || []).map((o) => {
          const [label, tone] = STATUS[o.status];
          return (
            <li key={o._id}>
              <Link to={`/commande/${o._id}`} className={`card link-card status-${tone}`}>
                <div className="row">
                  <strong>Commande {o._id.slice(-6)}</strong>
                  <span className={`tag ${tone}`}>{label}</span>
                </div>
                <span className="muted">{when(o.createdAt)}</span>
                <span>{o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</span>
                <span>{fcfa(o.total)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
