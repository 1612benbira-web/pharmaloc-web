import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import { compact, useRun } from "../admin.js";

export default function AdminMedicines() {
  const [items, setItems] = useState(null);
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ name: "", dosage: "", form: "", genericName: "", prescriptionRequired: false });

  const load = useCallback(async () => {
    try {
      const search = term.length >= 2 ? `&q=${encodeURIComponent(term)}` : "";
      const { data } = await api(`/medicines?limit=100${search}`);
      setItems(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [term]);
  useEffect(() => { load(); }, [load]);

  const { busy, error, notice, run } = useRun(load);
  const patch = (m, body, success) => run(() => api(`/medicines/${m._id}`, { method: "PATCH", body }), success);

  function togglePrescription(m) {
    if (m.prescriptionRequired && !window.confirm("Retirer l'obligation d'ordonnance ? Le médicament deviendra commandable en ligne sans ordonnance.")) return;
    patch(m, { prescriptionRequired: !m.prescriptionRequired }, "Médicament mis à jour.");
  }

  async function create(e) {
    e.preventDefault();
    const ok = await run(() => api("/medicines", { method: "POST", body: compact(f) }), "Médicament créé et publié.");
    if (ok) setF({ name: "", dosage: "", form: "", genericName: "", prescriptionRequired: false });
  }

  const shown = (items || [])
    .filter((m) => !pendingOnly || m.isActive === false)
    .sort((a, b) => Number(a.isActive !== false) - Number(b.isActive !== false) || a.name.localeCompare(b.name, "fr"));
  const pending = (items || []).filter((m) => m.isActive === false).length;
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  return (
    <section className="stack">
      <h1>Médicaments</h1>
      <form className="searchbar" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un médicament" aria-label="Rechercher" />
        <button className="secondary">Rechercher</button>
      </form>
      <label className="inline">
        <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
        Seulement ceux en attente de validation ({pending})
      </label>

      {loadError && <p role="alert" className="error">{loadError}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="ok-text">{notice}</p>}
      {items && shown.length === 0 && <p className="muted">Aucun médicament à afficher.</p>}

      <ul className="list">
        {shown.map((m) => {
          const active = m.isActive !== false;
          return (
            <li key={m._id} className={`card status-${active ? "ok" : "warn"}`}>
              <div className="row">
                <strong>{m.name}</strong>
                <span className={`tag ${active ? "ok" : "warn"}`}>{active ? "Publié" : "En attente de validation"}</span>
              </div>
              <span className="muted">{[m.dosage, m.form, m.genericName].filter(Boolean).join(" · ")}</span>
              {m.prescriptionRequired && <span className="tag warn">Sur ordonnance</span>}
              <div className="inline">
                {active
                  ? <button className="link" disabled={busy} onClick={() => patch(m, { isActive: false }, "Médicament retiré du catalogue.")}>Retirer du catalogue</button>
                  : <button className="primary" disabled={busy} onClick={() => patch(m, { isActive: true }, "Médicament publié.")}>Valider et publier</button>}
                <button className="link" disabled={busy} onClick={() => togglePrescription(m)}>
                  {m.prescriptionRequired ? "Retirer l'ordonnance" : "Exiger une ordonnance"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="box">
        <button className="secondary" onClick={() => setCreating(!creating)}>{creating ? "Fermer" : "Ajouter un médicament"}</button>
        {creating && (
          <form onSubmit={create} className="stack">
            <div className="fields">
              <label>Nom<input value={f.name} onChange={set("name")} required /></label>
              <label>Dosage<input value={f.dosage} onChange={set("dosage")} /></label>
              <label>Forme<input value={f.form} onChange={set("form")} /></label>
              <label>Nom générique<input value={f.genericName} onChange={set("genericName")} /></label>
            </div>
            <label className="inline">
              <input type="checkbox" checked={f.prescriptionRequired} onChange={(e) => setF({ ...f, prescriptionRequired: e.target.checked })} />
              Délivré sur ordonnance
            </label>
            <div><button className="primary" disabled={busy}>Créer et publier</button></div>
          </form>
        )}
      </div>
    </section>
  );
}
