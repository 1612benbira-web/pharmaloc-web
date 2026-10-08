import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorText } from "../api.js";

export default function ResetPassword() {
  const [params, setParams] = useSearchParams();
  // Le jeton est gardé en mémoire puis retiré de l'adresse (historique, copier-coller, en-têtes).
  const [token] = useState(() => params.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (params.get("token")) setParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, newPassword: password } });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="brand big"><span className="cross" aria-hidden="true" />PharmaLoc</div>
      <h1>Nouveau mot de passe</h1>

      {done && (
        <>
          <p role="status" className="ok-text">Mot de passe modifié. Vous pouvez vous connecter.</p>
          <p><Link to="/connexion">Se connecter</Link></p>
        </>
      )}

      {!done && !token && (
        <>
          <p role="alert" className="error">Ce lien est incomplet. Utilisez le lien reçu par e-mail, ou demandez-en un nouveau.</p>
          <p><Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link></p>
        </>
      )}

      {!done && token && (
        <form onSubmit={submit} className="stack">
          <label>Nouveau mot de passe
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} autoComplete="new-password" />
          </label>
          <label>Confirmer le mot de passe
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={10} autoComplete="new-password" />
          </label>
          <p className="hint">10 caractères minimum. Vous serez déconnecté de tous vos appareils.</p>
          {error && (
            <p role="alert" className="error">
              {error} {error.includes("lien") && <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>}
            </p>
          )}
          <button className="primary" disabled={busy}>{busy ? "Un instant…" : "Changer le mot de passe"}</button>
        </form>
      )}
    </main>
  );
}
