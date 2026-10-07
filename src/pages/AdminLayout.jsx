import { NavLink, Outlet } from "react-router-dom";
import "../pharmacy.css";

export default function AdminLayout() {
  return (
    <div className="stack">
      <nav className="tabs" aria-label="Administration">
        <NavLink to="/admin" end>Médicaments</NavLink>
        <NavLink to="/admin/pharmacies">Pharmacies</NavLink>
        <NavLink to="/admin/comptes">Comptes</NavLink>
        <NavLink to="/admin/paiements">Paiements</NavLink>
        <NavLink to="/admin/journal">Journal</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
