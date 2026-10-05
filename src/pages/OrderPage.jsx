import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorText } from "../api.js";
import { STATUS, fcfa } from "./MyOrders.jsx";

const METHODS = [["WAVE", "Wave"], ["ORANGE_MONEY", "Orange Money"], ["FREE_MONEY", "Free Money"], ["CARD", "Carte bancaire"]];
const time = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [method, setMethod] = useState("WAVE");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api(`/orders/${id}`);
      setOrder(data);
      setError("");
      // Le code de remise n'existe qu'une fois la commande prête, pour une livraison.
      if (data.fulfillment === "DELIVERY" && ["READY", "OUT_FOR_DELIVERY", "COMPLETED"].includes(data.status)) {
        api(`/shipments/order/${id}`).then(({ data: s }) => setShipment(s)).catch(() => setShipment(null));
      }
    } catch (err) {
      setError(errorText(err));
    }
  }, [id]);

  // Le suivi se met à jour tout seul toutes les 10 secondes.
  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  async function run(action, message) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (message) setNotice(message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      await load();
      setBusy(false);
    }
  }

  const pay = () => run(
    () => api("/payments", { method: "POST", body: { orderId: id, method }, headers: { "Idempotency-Key": crypto.randomUUID() } }),
    "Paiement lancé : en attente de confirmation."
  );
  const cancel = () => run(() => api(`/orders/${id}/cancel`, { method: "POST" }), "Commande annulée.");
  const simulate = (outcome) => run(() => api(`/payments/order/${id}/simulate`, { method: "POST", body: { outcome } }));

  if (!order) {
    return error ? <p role="alert" className="error">{error}</p> : <p className="muted">Chargement…</p>;
  }
  const [label, tone] = STATUS[order.status];
  const delivery = order.fulfillment === "DELIVERY";

  return (
    <section className="stack">
      <Link to="/commandes" className="link">Mes commandes</Link>
      <div className="row">
        <h1>Commande {order._id.slice(-6)}</h1>
        <span className={`tag ${tone}`}>{label}</span>
      </div>

      <div className="box">
        <ul className="items">
          {order.items.map((i) => <li key={i.medicine}>{i.quantity} × {i.name} : {fcfa(i.unitPrice * i.quantity)}</li>)}
        </ul>
        {delivery && <span>Livraison : {fcfa(order.deliveryFee)}</span>}
        <strong>Total : {fcfa(order.total)}</strong>
        <span className="muted">{delivery ? `Livraison à : ${order.deliveryAddress}` : "Retrait en pharmacie"}</span>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="ok-text">{notice}</p>}

      {order.status === "PAYMENT_PENDING" && (
        <div className="box">
          <h2>Paiement</h2>
          <p className="hint">Vos médicaments sont réservés jusqu'à {time(order.reservationExpiresAt)}. Passé ce délai, la commande expire.</p>
          <label>Moyen de paiement
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>
          <div className="inline">
            <button className="primary" disabled={busy} onClick={pay}>Payer {fcfa(order.total)}</button>
            <button className="link" disabled={busy} onClick={cancel}>Annuler la commande</button>
          </div>
        </div>
      )}

      {import.meta.env.DEV && order.status === "PAYMENT_PENDING" && (
        <div className="box devbox">
          <h2>Mode test (développement uniquement)</h2>
          <p className="hint">Aucun argent réel ne circule. Cliquez d'abord sur « Payer », puis simulez la réponse de l'opérateur.</p>
          <div className="inline">
            <button className="secondary" disabled={busy} onClick={() => simulate("PAID")}>Simuler : paiement réussi</button>
            <button className="secondary" disabled={busy} onClick={() => simulate("FAILED")}>Simuler : paiement refusé</button>
          </div>
        </div>
      )}

      {order.status === "READY" && !delivery && <p className="notice">Votre commande est prête : retirez-la en pharmacie.</p>}

      {shipment && shipment.deliveryCode && (
        <div className="box">
          <h2>Code de remise</h2>
          <p className="code" aria-label="Code de remise">{shipment.deliveryCode}</p>
          <p className="hint">Donnez ce code au livreur uniquement quand vous avez reçu vos médicaments.</p>
          {shipment.courier && <span>Livreur : {shipment.courier.name}</span>}
        </div>
      )}
    </section>
  );
}
