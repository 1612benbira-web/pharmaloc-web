import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText } from "../api.js";

const fcfa = (n) => `${n.toLocaleString("fr-FR")} FCFA`;

// Réception d'une livraison du fournisseur : le stock augmente. Lot et péremption vont ensemble.
function Receive({ stock, onDone }) {
  const empty = { quantity: "", lotNumber: "", expiryDate: "", supplier: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const lotUsed = Boolean(f.lotNumber || f.expiryDate);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const body = { pharmacy: stock.pharmacy._id, medicine: stock.medicine._id, quantity: Number(f.quantity) };
    if (f.lotNumber) body.lotNumber = f.lotNumber.trim();
    if (f.expiryDate) body.expiryDate = f.expiryDate;
    if (f.supplier) body.supplier = f.supplier.trim();
    try {
      await api("/deliveries", { method: "POST", body, headers: { "Idempotency-Key": crypto.randomUUID() } });
      setF(empty);
      setMsg({ ok: true, text: "Réception enregistrée : le stock est à jour." });
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Enregistrer une réception</h2>
      <div className="fields">
        <label>Quantité reçue
          <input type="number" min="1" step="1" value={f.quantity} onChange={set("quantity")} required />
        </label>
        <label>Numéro de lot
          <input value={f.lotNumber} onChange={set("lotNumber")} required={lotUsed} />
        </label>
        <label>Date de péremption
          <input type="date" value={f.expiryDate} onChange={set("expiryDate")} required={lotUsed} />
        </label>
        <label>Fournisseur
          <input value={f.supplier} onChange={set("supplier")} />
        </label>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok-text" : "error"}>{msg.text}</p>}
      <button className="primary" disabled={busy}>{busy ? "Un instant…" : "Enregistrer la réception"}</button>
    </form>
  );
}

// Prix de vente (réservé au responsable) : sans prix, le produit ne peut pas être commandé en ligne.
function Price({ stock, onDone }) {
  const [price, setPrice] = useState(stock.price ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api(`/stocks/${stock._id}`, { method: "PATCH", body: { price: Number(price) } });
      setMsg({ ok: true, text: "Prix enregistré." });
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Prix de vente</h2>
      <label>Prix en FCFA
        <input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </label>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok-text" : "error"}>{msg.text}</p>}
      <button className="secondary" disabled={busy}>{busy ? "Un instant…" : "Enregistrer le prix"}</button>
    </form>
  );
}

export default function PharmacyStocks() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api("/stocks?limit=100");
      setStocks(data.sort((a, b) => a.medicine.name.localeCompare(b.medicine.name, "fr")));
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="stack">
      <h1>Stocks</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {stocks === null && !error && <p className="muted">Chargement…</p>}
      {stocks && stocks.length === 0 && <p className="muted">Aucun produit en stock pour le moment.</p>}

      <ul className="list">
        {(stocks || []).map((s) => {
          const out = s.quantity === 0;
          const low = !out && s.quantity < s.minimumQuantity;
          return (
            <li key={s._id} className={`card status-${out ? "bad" : low ? "warn" : "ok"}`}>
              <div className="row">
                <strong>{s.medicine.name}</strong>
                {out && <span className="tag bad">Rupture</span>}
                {low && <span className="tag warn">Stock faible</span>}
              </div>
              <span className="muted">{[s.medicine.dosage, s.medicine.form].filter(Boolean).join(" · ")}</span>
              <span>{s.quantity} en stock</span>
              {typeof s.price === "number" ? <span>{fcfa(s.price)}</span> : <span className="tag warn">Prix à renseigner</span>}
              <div>
                <button className="link" onClick={() => setOpenId(openId === s._id ? null : s._id)}>
                  {openId === s._id ? "Fermer" : "Gérer ce produit"}
                </button>
              </div>
              {openId === s._id && (
                <div className="panel">
                  <Receive stock={s} onDone={load} />
                  {user.role === "pharmacy_manager" && <Price stock={s} onDone={load} />}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
