import { useCallback, useState } from "react";
import { errorText } from "./api.js";

// Exécute une action de l'interface : gère l'attente, affiche l'erreur ou le succès, puis recharge la liste.
// Renvoie true si l'action a réussi (utile pour vider un formulaire).
export function useRun(reload) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const run = useCallback(async (action, success) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (success) setNotice(success);
      await reload();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [reload]);

  return { busy, error, notice, run };
}

// Ne garde que les champs renseignés (l'API refuse les chaînes vides).
export const compact = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]).filter(([, v]) => v !== "" && v !== undefined));
