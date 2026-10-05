import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorText } from "../api.js";

// [libellé affiché, classe de couleur]
const STATUS = {
  AVAILABLE: ["Disponible", "ok"],
  LOW: ["Stock faible", "warn"],
  STALE: ["À confirmer par téléphone", "warn"],
  UNCONFIRMED: ["Non confirmé", "warn"],
  OUT_OF_STOCK: ["Rupture", "bad"]
};
const fcfa = (n) => `${n.toLocaleString("fr-FR")} FCFA`;
const when = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

// Formulaire de commande d'un médicament dans une pharmacie. Le prix est calculé par le serveur.
function OrderBox({ medicineId, pharmacyId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ quantity: 1, fulfillment: "PICKUP", deliveryAddress: "", contactPhone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { pharmacy: pharmacyId, fulfillment: f.fulfillment, items: [{ medicine: medicineId, quantity: Number(f.quantity) }] };
    if (f.fulfillment === "DELIVERY") {
      body.deliveryAddress = f.deliveryAddress.trim();
      body.contactPhone = f.contactPhone.trim();
    }
    try {
      const { data } = await api("/orders", { method: "POST", body, headers: { "Idempotency-Key": crypto.randomUUID() } });
      navigate(`/commande/${data.order._id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  if (!open) return <button className="primary" onClick={() => setOpen(true)}>Commander</button>;
  return (
    <form onSubmit={submit} className="stack">
      <div className="fields">
        <label>Quantité
          <input type="number" min="1" max="50" step="1" value={f.quantity} onChange={set("quantity")} required />
        </label>
        <label>Mode de remise
          <select value={f.fulfillment} onChange={set("fulfillment")}>
            <option value="PICKUP">Retrait en pharmacie</option>
            <option value="DELIVERY">Livraison à domicile (+ 750 FCFA)</option>
          </select>
        </label>
      </div>
      {f.fulfillment === "DELIVERY" && (
        <div className="fields">
          <label>Adresse de livraison
            <input value={f.deliveryAddress} onChange={set("deliveryAddress")} required minLength={5} autoComplete="street-address" />
          </label>
          <label>Téléphone
            <input type="tel" value={f.contactPhone} onChange={set("contactPhone")} required autoComplete="tel" />
          </label>
        </div>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      <div className="inline">
        <button className="primary" disabled={busy}>{busy ? "Un instant…" : "Valider la commande"}</button>
        <button type="button" className="link" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  );
}

export default function Availability() {
  const { id } = useParams();
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    const query = position ? `?lat=${position.lat.toFixed(5)}&lng=${position.lng.toFixed(5)}` : "";
    api(`/catalog/medicines/${id}/availability${query}`)
      .then(({ data }) => !cancelled && setState({ data }))
      .catch((err) => !cancelled && setState({ error: errorText(err) }));
    return () => { cancelled = true; };
  }, [id, position]);

  function locate() {
    setGeoError("");
    if (!navigator.geolocation) return setGeoError("La localisation n'est pas disponible sur cet appareil.");
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGeoError("Localisation refusée : les pharmacies sont affichées sans distance.")
    );
  }

  const { data, error, loading } = state;
  return (
    <section className="stack">
      <Link to="/rechercher" className="link">Retour à la recherche</Link>
      {loading && <p className="muted">Recherche des pharmacies…</p>}
      {error && <p role="alert" className="error">{error}</p>}

      {data && (
        <>
          <div>
            <h1>{data.medicine.name}</h1>
            <p className="muted">{[data.medicine.dosage, data.medicine.form].filter(Boolean).join(" · ")}</p>
            {data.medicine.prescriptionRequired && (
              <p className="notice">Ce médicament nécessite une ordonnance : présentez-la en pharmacie.</p>
            )}
          </div>

          <div>
            <button className="secondary" onClick={locate}>{position ? "Position mise à jour" : "Trier par distance"}</button>
            {geoError && <p className="hint">{geoError}</p>}
          </div>

          {data.results.length === 0 && (
            <p className="muted">Aucune pharmacie ne publie sa disponibilité pour ce médicament pour le moment.</p>
          )}

          <ul className="list">
            {data.results.map((r) => {
              const [label, tone] = STATUS[r.status] || STATUS.UNCONFIRMED;
              return (
                <li key={r.pharmacy.id} className={`card status-${tone}`}>
                  <div className="row">
                    <strong>{r.pharmacy.name}</strong>
                    <span className={`tag ${tone}`}>{label}</span>
                  </div>
                  <span className="muted">{[r.pharmacy.address, r.pharmacy.city].filter(Boolean).join(", ")}</span>
                  {r.distanceKm !== undefined && <span>À {r.distanceKm.toLocaleString("fr-FR")} km</span>}
                  {r.price !== undefined && <span>{fcfa(r.price)}</span>}
                  {r.quantity !== undefined && <span>{r.quantity} en stock</span>}
                  {r.pharmacy.openingHours && <span className="muted">{r.pharmacy.openingHours}</span>}
                  <div className="row">
                    <a href={`tel:${r.pharmacy.phone}`}>{r.pharmacy.phone}</a>
                    {r.orderable && <span className="tag ok">Commandable en ligne</span>}
                  </div>
                  {r.orderable && <OrderBox medicineId={id} pharmacyId={r.pharmacy.id} />}
                  <span className="hint">Mis à jour le {when(r.lastUpdatedAt)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
