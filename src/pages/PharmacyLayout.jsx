import { NavLink, Outlet } from "react-router-dom";
import "../pharmacy.css";

export default function PharmacyLayout() {
  return (
    <div className="stack">
      <nav className="tabs" aria-label="Espace pharmacie">
        <NavLink to="/pharmacie" end>Commandes</NavLink>
        <NavLink to="/pharmacie/stocks">Stocks</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
