import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import "../pharmacy.css";

export default function PharmacyLayout() {
  const { user } = useAuth();
  return (
    <div className="stack">
      <nav className="tabs" aria-label="Espace pharmacie">
        <NavLink to="/pharmacie" end>Commandes</NavLink>
        <NavLink to="/pharmacie/stocks">Stocks</NavLink>
        <NavLink to="/pharmacie/statistiques">Statistiques</NavLink>
        {user.role === "pharmacy_manager" && <NavLink to="/pharmacie/medicaments">Médicaments</NavLink>}
      </nav>
      <Outlet />
    </div>
  );
}
