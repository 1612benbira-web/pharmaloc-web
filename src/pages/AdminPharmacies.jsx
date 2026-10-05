import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import { compact, useRun } from "../admin.js";

const empty = { name: "", address: "", city: "", phone: "", latitude: "", longitude: "" };

export default function AdminPharmacies() {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState(empty);

  const load = useCallback(async () => {
    try {
      const { data } = await api("/pharmacies?limit=100");
      setItems(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const { busy, error, notice, run } = useRun(load);
  const setActive = (p, isActive) =>
    run(() => api(`/pharmacies/${p._id}`, { method: "PATCH", body: { isActive } }), isActive ? "Pharmacie réactivée." : "Pharmacie suspendue : elle n'est plus visible des patients.");

  async function create(e) {
    e.preventDefault();
    const body = compact({ ...f, latitude: f.latitude === "" ? "" : Number(f.latitude), longitude: f.longitude === "" ? "" : Number(f.longitude) });
    const ok = await run(() => api("/pharmacies", { method: "POST", body }), "Pharmacie créée.");
    if (ok) setF(empty);
  }
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const withCoords = f.latitude !== "" || f.longitude !== "";

  return (
    <section className="stack">
      <h1>Pharmacies</h1>
      {loadError && <p role="alert" className="error">{loadError}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="ok-text">{notice}</p>}
      {items && items.length === 0 && <p className="muted">Aucune pharmacie.</p>}

      <ul className="list">
        {(items || []).map((p) => (
          <li key={p._id} className={`card status-${p.isActive ? "ok" : "bad"}`}>
            <div className="row">
              <strong>{p.name}</strong>
              <span className={`tag ${p.isActive ? "ok" : "bad"}`}>{p.isActive ? "Active" : "Suspendue"}</span>
            </div>
            <span className="muted">{[p.address, p.city].filter(Boolean).join(", ")} · {p.phone}</span>
            <span className="hint">
              {p.publishAvailability ? "Publie sa disponibilité" : "Ne publie pas sa disponibilité"}
              {typeof p.latitude === "number" ? "" : " · sans coordonnées (pas de distance)"}
            </span>
            <div>
              <button className="link" disabled={busy} onClick={() => setActive(p, !p.isActive)}>
                {p.isActive ? "Suspendre" : "Réactiver"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="box">
        <button className="secondary" onClick={() => setCreating(!creating)}>{creating ? "Fermer" : "Ajouter une pharmacie"}</button>
        {creating && (
          <form onSubmit={create} className="stack">
            <div className="fields">
              <label>Nom<input value={f.name} onChange={set("name")} required /></label>
              <label>Adresse<input value={f.address} onChange={set("address")} required /></label>
              <label>Ville<input value={f.city} onChange={set("city")} required /></label>
              <label>Téléphone<input type="tel" value={f.phone} onChange={set("phone")} required /></label>
              <label>Latitude (facultatif)<input type="number" step="any" min="-90" max="90" value={f.latitude} onChange={set("latitude")} required={withCoords} /></label>
              <label>Longitude (facultatif)<input type="number" step="any" min="-180" max="180" value={f.longitude} onChange={set("longitude")} required={withCoords} /></label>
            </div>
            <div><button className="primary" disabled={busy}>Créer la pharmacie</button></div>
          </form>
        )}
      </div>
    </section>
  );
}
