import { useEffect, useState } from "react";
import { api, errorText } from "../api.js";

const fcfa = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
const STATUS = {
  PAYMENT_PENDING: "En attente de paiement", CONFIRMED: "Payées", PREPARING: "En préparation", READY: "Prêtes",
  OUT_FOR_DELIVERY: "En livraison", COMPLETED: "Terminées", CANCELLED: "Annulées", EXPIRED: "Expirées"
};

function Figure({ label, value, tone }) {
  return (
    <div className={`card status-${tone || "ok"}`}>
      <span className="muted">{label}</span>
      <strong className="sub">{value}</strong>
    </div>
  );
}

export default function PharmacyStats() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    api(`/orders/pharmacy/stats?days=${days}`)
      .then((res) => { if (!cancelled) { setData(res.data); setError(""); } })
      .catch((err) => { if (!cancelled) setError(errorText(err)); });
    return () => { cancelled = true; };
  }, [days]);

  return (
    <section className="stack">
      <h1>Statistiques</h1>
      <label>Période
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </label>

      {error && <p role="alert" className="error">{error}</p>}
      {!data && !error && <p className="muted">Chargement…</p>}

      {data && (
        <>
          <h2 className="sub">Ventes</h2>
          <div className="list">
            <Figure label="Commandes payées" value={data.orders} />
            <Figure label="Chiffre d'affaires" value={fcfa(data.revenue)} />
            <Figure label="Panier moyen" value={fcfa(data.averageBasket)} />
            <Figure label="dont frais de livraison" value={fcfa(data.deliveryFees)} />
          </div>
          <p className="hint">Les commandes annulées, remboursées ou expirées ne sont pas comptées.</p>

          <h2 className="sub">Produits les plus vendus</h2>
          {data.topProducts.length === 0 && <p className="muted">Aucune vente sur la période.</p>}
          <ul className="list">
            {data.topProducts.map((p) => (
              <li key={p.medicineId} className="card status-ok">
                <div className="row"><strong>{p.name}</strong><span>{p.quantity} vendu(s)</span></div>
                <span className="muted">{fcfa(p.revenue)}</span>
              </li>
            ))}
          </ul>

          <h2 className="sub">État du stock</h2>
          <div className="list">
            <Figure label="Produits en rupture" value={data.stock.outOfStock} tone={data.stock.outOfStock ? "bad" : "ok"} />
            <Figure label="Produits en stock faible" value={data.stock.lowStock} tone={data.stock.lowStock ? "warn" : "ok"} />
            <Figure label="Lots qui expirent dans 30 jours" value={data.stock.lotsExpiringIn30Days} tone={data.stock.lotsExpiringIn30Days ? "warn" : "ok"} />
          </div>

          <h2 className="sub">Commandes par statut</h2>
          {Object.keys(data.ordersByStatus).length === 0 && <p className="muted">Aucune commande sur la période.</p>}
          <ul className="list">
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <li key={status} className="card status-ok">
                <div className="row"><span>{STATUS[status] || status}</span><strong>{count}</strong></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
