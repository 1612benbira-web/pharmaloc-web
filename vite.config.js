import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En développement, le navigateur parle à Vite (http://localhost:5173) et Vite relaie /api vers l'API (port 3000).
// Cookie de session et contrôle d'origine fonctionnent ainsi sans CORS.
// Ne pas activer changeOrigin : l'API compare l'en-tête Origin à l'en-tête Host.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:3000" } }
});
