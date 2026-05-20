/**
 * ============================================================
 * FinovaWealth — Application Entry Point
 * File: Frontend/src/main.jsx
 * ============================================================
 * Wraps the app with:
 *   • GoogleOAuthProvider (for @react-oauth/google)
 *   • AuthProvider (session persistence)
 *   • Toaster (react-hot-toast)
 * ============================================================
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.jsx";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "459304279330-dktcbf6avqp3p0hkqui66cq4a3camsf7.apps.googleusercontent.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
