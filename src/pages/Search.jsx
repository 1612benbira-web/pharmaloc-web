import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorText } from "../api.js";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api(`/catalog/medicines?q=${encodeURIComponent(q.trim())}`);
      setResults(data);
    } catch (err) {
      setError(errorText(err));
      setResults(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h1>Quel médicament cherchez-vous ?</h1>
      <form onSubmit={submit} className="searchbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Paracétamol, amoxicilline…"
               aria-label="Nom du médicament" minLength={2} required />
        <button className="primary" disabled={busy || q.trim().length < 2}>{busy ? "Recherche…" : "Rechercher"}</button>
      </form>

      {error && <p role="alert" className="error">{error}</p>}
      {results && results.length === 0 && (
        <p className="muted">Aucun médicament ne correspond à « {q.trim()} ». Vérifiez l'orthographe ou essayez le nom générique.</p>
      )}

      <ul className="list">
        {(results || []).map((m) => (
          <li key={m.id}>
            <Link to={`/medicament/${m.id}`} className="card link-card">
              <strong>{m.name}</strong>
              <span className="muted">{[m.dosage, m.form, m.genericName].filter(Boolean).join(" · ")}</span>
              {m.prescriptionRequired && <span className="tag warn">Sur ordonnance</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
