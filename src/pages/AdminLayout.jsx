import { NavLink, Outlet } from "react-router-dom";
import "../pharmacy.css";

export default function AdminLayout() {
  return (
    <div className="stack">
      <nav className="tabs" aria-label="Administration">
        <NavLink to="/admin" end>Médicaments</NavLink>
        <NavLink to="/admin/pharmacies">Pharmacies</NavLink>
        <NavLink to="/admin/comptes">Comptes</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
