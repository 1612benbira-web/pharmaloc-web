import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorText } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api("/auth/forgot-password", { method: "POST", body: { email: email.trim() } });
      setSent(data.message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="brand big"><span className="cross" aria-hidden="true" />PharmaLoc</div>
      <h1>Mot de passe oublié</h1>
      {sent ? (
        <>
          <p role="status" className="ok-text">{sent}</p>
          <p className="muted">Le lien est valable 30 minutes. Pensez à vérifier vos courriers indésirables.</p>
        </>
      ) : (
        <form onSubmit={submit} className="stack">
          <p className="muted">Indiquez l'adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
          <label>Adresse e-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          {error && <p role="alert" className="error">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? "Un instant…" : "Envoyer le lien"}</button>
        </form>
      )}
      <p><Link to="/connexion">Retour à la connexion</Link></p>
    </main>
  );
}
