import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import { useRun } from "../admin.js";

const ROLES = { pharmacist: "Pharmacien", pharmacy_manager: "Responsable de pharmacie", courier: "Livreur", admin: "Administrateur" };
const empty = { name: "", email: "", password: "", role: "pharmacy_manager", pharmacy: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [role, setRole] = useState("");
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState(empty);

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([
        api(`/admin/users?limit=100${role ? `&role=${role}` : ""}`),
        api("/pharmacies?limit=100")
      ]);
      setUsers(u.data);
      setPharmacies(p.data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [role]);
  useEffect(() => { load(); }, [load]);

  const { busy, error, notice, run } = useRun(load);
  const setActive = (u, isActive) =>
    run(() => api(`/admin/users/${u.id}/status`, { method: "PATCH", body: { isActive } }), isActive ? "Compte réactivé." : "Compte suspendu : ses sessions sont fermées.");

  async function create(e) {
    e.preventDefault();
    const body = { name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role, pharmacies: f.role === "admin" ? [] : [f.pharmacy] };
    const ok = await run(() => api("/admin/users", { method: "POST", body }), "Compte créé. Communiquez le mot de passe à son titulaire de façon sûre.");
    if (ok) setF(empty);
  }
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  return (
    <section className="stack">
      <h1>Comptes du personnel</h1>
      <label>Filtrer par rôle
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tous</option>
          {Object.entries(ROLES).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
      </label>

      {loadError && <p role="alert" className="error">{loadError}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="ok-text">{notice}</p>}
      {users && users.length === 0 && <p className="muted">Aucun compte.</p>}

      <ul className="list">
        {(users || []).map((u) => (
          <li key={u.id} className={`card status-${u.isActive ? "ok" : "bad"}`}>
            <div className="row">
              <strong>{u.name}</strong>
              <span className={`tag ${u.isActive ? "ok" : "bad"}`}>{u.isActive ? "Actif" : "Suspendu"}</span>
            </div>
            <span>{ROLES[u.role]} · {u.email}</span>
            {u.pharmacies.length > 0 && <span className="muted">{u.pharmacies.map((p) => p.name || p.id).join(", ")}</span>}
            <div>
              <button className="link" disabled={busy} onClick={() => setActive(u, !u.isActive)}>
                {u.isActive ? "Suspendre" : "Réactiver"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="box">
        <button className="secondary" onClick={() => setCreating(!creating)}>{creating ? "Fermer" : "Créer un compte"}</button>
        {creating && (
          <form onSubmit={create} className="stack">
            <div className="fields">
              <label>Nom complet<input value={f.name} onChange={set("name")} required minLength={2} /></label>
              <label>Adresse e-mail<input type="email" value={f.email} onChange={set("email")} required /></label>
              <label>Mot de passe provisoire<input type="password" value={f.password} onChange={set("password")} required minLength={10} autoComplete="new-password" /></label>
              <label>Rôle
                <select value={f.role} onChange={set("role")}>
                  {Object.entries(ROLES).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              </label>
              {f.role !== "admin" && (
                <label>Pharmacie
                  <select value={f.pharmacy} onChange={set("pharmacy")} required>
                    <option value="">Choisir…</option>
                    {pharmacies.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <p className="hint">Mot de passe : 10 caractères minimum.</p>
            <div><button className="primary" disabled={busy}>Créer le compte</button></div>
          </form>
        )}
      </div>
    </section>
  );
}
