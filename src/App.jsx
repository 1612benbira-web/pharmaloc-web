import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Search from "./pages/Search.jsx";
import Availability from "./pages/Availability.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Deliveries from "./pages/Deliveries.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import PharmacyLayout from "./pages/PharmacyLayout.jsx";
import PharmacyOrders from "./pages/PharmacyOrders.jsx";
import PharmacyStocks from "./pages/PharmacyStocks.jsx";
import "./orders.css";

// Page d'accueil de chaque rôle.
const HOME = { patient: "/rechercher", pharmacist: "/pharmacie", pharmacy_manager: "/pharmacie", courier: "/livraisons", admin: "/admin" };

function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <NavLink to={HOME[user.role]} className="brand">
          <span className="cross" aria-hidden="true" />
          PharmaLoc
        </NavLink>
        {user.role === "patient" && (
          <nav className="topnav" aria-label="Navigation">
            <NavLink to="/rechercher">Rechercher</NavLink>
            <NavLink to="/commandes">Mes commandes</NavLink>
          </nav>
        )}
        <div className="who">
          <span>{user.name}</span>
          <button className="link" onClick={logout}>Se déconnecter</button>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}

// Zone protégée : connexion obligatoire, puis rôle autorisé (sinon retour à l'accueil de son rôle).
function Guard({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Chargement…</p>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME[user.role]} replace />;
  return <Layout />;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/connexion" element={loading ? null : user ? <Navigate to={HOME[user.role]} replace /> : <AuthPage />} />

      <Route element={<Guard roles={["patient"]} />}>
        <Route path="/rechercher" element={<Search />} />
        <Route path="/medicament/:id" element={<Availability />} />
        <Route path="/commandes" element={<MyOrders />} />
        <Route path="/commande/:id" element={<OrderPage />} />
      </Route>

      <Route element={<Guard roles={["pharmacist", "pharmacy_manager"]} />}>
        <Route element={<PharmacyLayout />}>
          <Route path="/pharmacie" element={<PharmacyOrders />} />
          <Route path="/pharmacie/stocks" element={<PharmacyStocks />} />
        </Route>
      </Route>

      <Route element={<Guard roles={["courier"]} />}>
        <Route path="/livraisons" element={<Deliveries />} />
      </Route>

      <Route element={<Guard roles={["admin"]} />}>
        <Route path="/admin" element={<Placeholder title="Administration" text="La gestion des comptes, du catalogue et des pharmacies arrivera plus tard." />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? HOME[user.role] : "/connexion"} replace />} />
    </Routes>
  );
}
