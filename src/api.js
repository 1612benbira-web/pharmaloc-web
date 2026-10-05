// Client de l'API PharmaLoc. Le cookie de session part tout seul (même origine grâce au proxy).
export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || "Erreur inattendue");
    this.status = status;
    this.code = body && body.code;
    this.details = body && body.details;
  }
}

export async function api(path, { method = "GET", body, headers = {} } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin"
    });
  } catch {
    throw new ApiError(0, { message: "Le serveur est injoignable. Vérifiez votre connexion et réessayez.", code: "NETWORK" });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return { data, total: Number(res.headers.get("X-Total-Count")) || undefined };
}

// Message lisible pour l'utilisateur, avec le premier champ en erreur s'il y en a un.
export const errorText = (e) =>
  Array.isArray(e.details) && e.details[0] && e.details[0].message ? `${e.message} : ${e.details[0].message}` : e.message;
