import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import { useAuth } from "../auth.jsx";
import { compact, useRun } from "../admin.js";

const empty = { name: "", dosage: "", form: "", genericName: "" };

export default function PharmacyMedicines() {
  const { user } = useAuth();
  const [pending, setPending] = useState(null);
  const [f, setF] = useState(empty);
  const [loadError, setLoadError] = useState("");

  // Les médicaments en attente de validation (inactifs) sont visibles du personnel.
  const load = useCallback(async () => {
    try {
      const { data } = await api("/medicines?limit=100");
      setPending(data.filter((m) => m.isActive === false).sort((a, b) => a.name.localeCompare(b.name, "fr")));
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const { busy, error, notice, run } = useRun(load);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const ok = await run(
      () => api("/medicines", { method: "POST", body: compact(f) }),
      "Médicament proposé. Il sera visible des patients après validation par un administrateur."
    );
    if (ok) setF(empty);
  }

  if (user.role !== "pharmacy_manager") {
    return <p className="muted">Seul le responsable de la pharmacie peut proposer un médicament.</p>;
  }

  return (
    <section className="stack">
      <h1>Proposer un médicament</h1>
      <p className="muted">Si un produit manque au catalogue, proposez-le ici. Un administrateur le vérifie avant de le publier : il sera alors visible des patients et vous pourrez l'ajouter à votre stock.</p>

      <form onSubmit={submit} className="box">
        <div className="fields">
          <label>Nom du médicament<input value={f.name} onChange={set("name")} required maxLength={120} /></label>
          <label>Dosage<input value={f.dosage} onChange={set("dosage")} placeholder="500 mg" /></label>
          <label>Forme<input value={f.form} onChange={set("form")} placeholder="Comprimé" /></label>
          <label>Nom générique<input value={f.genericName} onChange={set("genericName")} /></label>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        {notice && <p role="status" className="ok-text">{notice}</p>}
        <div><button className="primary" disabled={busy}>{busy ? "Un instant…" : "Proposer ce médicament"}</button></div>
      </form>

      <h2 className="sub">En attente de validation</h2>
      {loadError && <p role="alert" className="error">{loadError}</p>}
      {pending && pending.length === 0 && <p className="muted">Aucune proposition en attente.</p>}
      <ul className="list">
        {(pending || []).map((m) => (
          <li key={m._id} className="card status-warn">
            <div className="row"><strong>{m.name}</strong><span className="tag warn">En attente</span></div>
            <span className="muted">{[m.dosage, m.form, m.genericName].filter(Boolean).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
