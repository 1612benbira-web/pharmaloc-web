import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorText } from "../api.js";
import { useAuth } from "../auth.jsx";

const ROLES = { patient: "Patient", pharmacist: "Pharmacien", pharmacy_manager: "Responsable de pharmacie", courier: "Livreur", admin: "Administrateur" };
const empty = { current: "", next: "", confirm: "" };

export default function Account() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const forced = Boolean(user.mustChangePassword);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (f.next !== f.confirm) return setError("Les deux nouveaux mots de passe ne sont pas identiques.");
    setBusy(true);
    try {
      const { data } = await api("/auth/change-password", { method: "POST", body: { currentPassword: f.current, newPassword: f.next } });
      setF(empty);
      if (forced) {
        // Le mot de passe provisoire est remplacé : on relit le profil puis on ouvre l'application.
        await refresh();
        navigate("/", { replace: true });
        return;
      }
      setNotice(data.message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <h1>Mon compte</h1>
      <p className="muted">{user.name} · {user.email} · {ROLES[user.role]}</p>
      {forced && <p className="notice">Votre mot de passe est provisoire : choisissez-en un nouveau pour accéder à l'application.</p>}

      <form onSubmit={submit} className="box">
        <h2>Changer mon mot de passe</h2>
        <label>{forced ? "Mot de passe provisoire" : "Mot de passe actuel"}
          <input type="password" value={f.current} onChange={set("current")} required autoComplete="current-password" />
        </label>
        <label>Nouveau mot de passe
          <input type="password" value={f.next} onChange={set("next")} required minLength={10} autoComplete="new-password" />
        </label>
        <label>Confirmer le nouveau mot de passe
          <input type="password" value={f.confirm} onChange={set("confirm")} required minLength={10} autoComplete="new-password" />
        </label>
        <p className="hint">10 caractères minimum. Vos autres appareils seront déconnectés.</p>
        {error && <p role="alert" className="error">{error}</p>}
        {notice && <p role="status" className="ok-text">{notice}</p>}
        <div><button className="primary" disabled={busy}>{busy ? "Un instant…" : "Changer le mot de passe"}</button></div>
      </form>
    </section>
  );
}
