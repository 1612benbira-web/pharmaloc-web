import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "./api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement : y a-t-il déjà une session ouverte ?
  useEffect(() => {
    api("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch((e) => {
        if (!(e instanceof ApiError) || e.status !== 401) console.error(e);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api("/auth/login", { method: "POST", body: { email, password } });
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name, email, password) => {
      await api("/auth/register", { method: "POST", body: { name, email, password } });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  // Relit le profil (par exemple après le changement du mot de passe provisoire).
  const refresh = useCallback(async () => {
    const { data } = await api("/auth/me");
    setUser(data.user);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}
