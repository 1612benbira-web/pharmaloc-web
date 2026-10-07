import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../api.js";

const ACTIONS = {
  USER_CREATED: "Compte créé",
  USER_ACTIVATED: "Compte réactivé",
  USER_DEACTIVATED: "Compte suspendu",
  PASSWORD_CHANGED: "Mot de passe changé",
  MEDICINE_CREATED: "Médicament ajouté",
  MEDICINE_UPDATED: "Médicament modifié",
  MEDICINE_DELETED: "Médicament supprimé",
  PHARMACY_CREATED: "Pharmacie créée",
  PHARMACY_UPDATED: "Pharmacie modifiée",
  PHARMACY_DELETED: "Pharmacie supprimée",
  ORDER_CANCELLED_PAID: "Commande payée annulée",
  PAYMENT_REFUNDED: "Paiement remboursé"
};
const KEYS = {
  reason: "Motif", fields: "Champs modifiés", name: "Nom", role: "Rôle", pharmacies: "Pharmacies",
  refund: "Remboursement", isActive: "Actif", prescriptionRequired: "Sur ordonnance"
};
const REFUND = { REFUNDED: "effectué", PENDING: "à traiter", NONE: "aucun paiement" };
const ROLES = { patient: "patient", pharmacist: "pharmacien", pharmacy_manager: "responsable", courier: "livreur", admin: "administrateur" };
const LIMIT = 30;

const valueText = (key, v) => {
  if (key === "refund") return REFUND[v] || String(v);
  if (typeof v === "boolean") return v ? "oui" : "non";
  return Array.isArray(v) ? v.join(", ") : String(v);
};
const metaText = (meta) => Object.entries(meta || {}).map(([k, v]) => `${KEYS[k] || k} : ${valueText(k, v)}`).join(" · ");
const when = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });

export default function AdminAudit() {
  const [entries, setEntries] = useState(null);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const filter = action ? `&action=${action}` : "";
      const { data, total: count } = await api(`/admin/audit?limit=${LIMIT}&page=${page}${filter}`);
      setEntries(data);
      setTotal(count || 0);
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, [action, page]);
  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <section className="stack">
      <h1>Journal des actions</h1>
      <label>Filtrer par action
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">Toutes</option>
          {Object.entries(ACTIONS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
      </label>

      {error && <p role="alert" className="error">{error}</p>}
      {entries && entries.length === 0 && <p className="muted">Aucune action enregistrée.</p>}

      <ul className="list">
        {(entries || []).map((e) => (
          <li key={e.id} className="card status-ok">
            <div className="row">
              <strong>{ACTIONS[e.action] || e.action}</strong>
              <span className="muted">{when(e.createdAt)}</span>
            </div>
            <span>{e.actor ? `${e.actor.name} (${ROLES[e.actor.role] || e.actor.role}) · ${e.actor.email}` : "Acteur inconnu"}</span>
            {e.target && <span className="hint">Cible : {e.target}</span>}
            {e.meta && Object.keys(e.meta).length > 0 && <span className="muted">{metaText(e.meta)}</span>}
          </li>
        ))}
      </ul>

      {total > LIMIT && (
        <div className="inline">
          <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Plus récent</button>
          <span className="muted">Page {page} sur {pages}</span>
          <button className="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Plus ancien</button>
        </div>
      )}
    </section>
  );
}
