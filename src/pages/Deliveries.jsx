import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import "../courier.css";

const messageOf = (err) =>
  err.code === "INVALID_DELIVERY_CODE" && err.details
    ? `${err.message} (${err.details.attemptsLeft} essai(s) restant(s))`
    : errorText(err);

// Course prise par le livreur : à récupérer en pharmacie, puis à remettre au client avec son code.
function Active({ s, run, busy }) {
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [failing, setFailing] = useState(false);
  const post = (action, body) => run(() => api(`/shipments/${s.id}/${action}`, { method: "POST", body }));
  const picked = s.status === "PICKED_UP";
  const tone = picked ? "ok" : "warn";

  return (
    <li className={`card status-${tone}`}>
      <div className="row">
        <strong>{s.pharmacy.name}</strong>
        <span className={`tag ${tone}`}>{picked ? "En route chez le client" : "À récupérer en pharmacie"}</span>
      </div>
      <span className="muted">Pharmacie : {[s.pharmacy.address, s.pharmacy.city].filter(Boolean).join(", ")} · <a href={`tel:${s.pharmacy.phone}`}>{s.pharmacy.phone}</a></span>
      <span>Livrer à : {s.address}</span>
      <span>Client : <a href={`tel:${s.contactPhone}`}>{s.contactPhone}</a></span>
      <ul className="items">{s.items.map((i, n) => <li key={n}>{i.quantity} × {i.name}</li>)}</ul>
      {s.attempt > 1 && <span className="hint">Tentative n°{s.attempt}</span>}

      {!picked && (
        <div className="inline">
          <button className="primary" disabled={busy} onClick={() => post("pickup")}>J'ai récupéré la commande</button>
          <button className="link" disabled={busy} onClick={() => post("release")}>Rendre cette course</button>
        </div>
      )}

      {picked && (
        <>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); post("deliver", { code }); }}>
            <label>Code donné par le client
              <input className="codeinput" inputMode="numeric" pattern="\d{6}" maxLength={6} value={code} required
                     onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="off" />
            </label>
            <div><button className="primary" disabled={busy || code.length !== 6}>Confirmer la livraison</button></div>
          </form>
          {!failing && <button className="link" onClick={() => setFailing(true)}>Le client est injoignable ou refuse la livraison</button>}
          {failing && (
            <form className="stack" onSubmit={(e) => { e.preventDefault(); post("fail", { reason: reason.trim() }); }}>
              <label>Motif
                <input value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} maxLength={200} required />
              </label>
              <div><button className="secondary" disabled={busy}>Signaler l'échec</button></div>
            </form>
          )}
        </>
      )}
    </li>
  );
}

export default function Deliveries() {
  const [available, setAvailable] = useState(null);
  const [mine, setMine] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([api("/shipments/available?limit=50"), api("/shipments/mine?limit=50")]);
      setAvailable(a.data);
      setMine(m.data.filter((s) => s.status === "ASSIGNED" || s.status === "PICKED_UP"));
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  // La liste se met à jour toute seule toutes les 15 secondes.
  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function run(action) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await action();
      if (res && res.data && res.data.message) setNotice(res.data.message);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      await load();
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h1>Mes livraisons</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="ok-text">{notice}</p>}

      <h2 className="sub">Ma course en cours</h2>
      {mine === null && !error && <p className="muted">Chargement…</p>}
      {mine && mine.length === 0 && <p className="muted">Aucune course en cours. Prenez-en une ci-dessous.</p>}
      <ul className="list">{(mine || []).map((s) => <Active key={s.id} s={s} run={run} busy={busy} />)}</ul>

      <h2 className="sub">Courses disponibles</h2>
      {available && available.length === 0 && <p className="muted">Aucune course disponible pour le moment. La liste se met à jour toute seule.</p>}
      <ul className="list">
        {(available || []).map((s) => (
          <li key={s.id} className="card status-warn">
            <strong>{s.pharmacy.name}</strong>
            <span className="muted">{[s.pharmacy.address, s.pharmacy.city].filter(Boolean).join(", ")}</span>
            <span>Livrer à : {s.address}</span>
            <span>{s.itemsCount} article(s){s.attempt > 1 ? ` · tentative n°${s.attempt}` : ""}</span>
            <div>
              <button className="primary" disabled={busy}
                      onClick={() => run(() => api(`/shipments/${s.id}/claim`, { method: "POST" }))}>
                Prendre cette course
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
