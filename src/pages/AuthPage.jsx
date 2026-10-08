import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { errorText } from "../api.js";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="brand big"><span className="cross" aria-hidden="true" />PharmaLoc</div>
      <h1>{isLogin ? "Connexion" : "Créer un compte"}</h1>
      <p className="muted">Trouvez votre médicament dans les pharmacies près de chez vous.</p>

      <form onSubmit={submit} className="stack">
        {!isLogin && (
          <label>Nom complet
            <input value={form.name} onChange={set("name")} required minLength={2} autoComplete="name" />
          </label>
        )}
        <label>Adresse e-mail
          <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
        </label>
        <label>Mot de passe
          <input type="password" value={form.password} onChange={set("password")} required
                 minLength={isLogin ? 1 : 10} autoComplete={isLogin ? "current-password" : "new-password"} />
        </label>
        {!isLogin && <p className="hint">10 caractères au minimum.</p>}
        {error && <p role="alert" className="error">{error}</p>}
        <button className="primary" disabled={busy}>
          {busy ? "Un instant…" : isLogin ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      {isLogin && <p><Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link></p>}

      <button className="link" onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>
        {isLogin ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
    </main>
  );
}
