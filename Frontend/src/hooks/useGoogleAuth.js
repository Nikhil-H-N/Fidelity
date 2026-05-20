/**
 * ============================================================
 * FinovaWealth — useGoogleAuth Hook
 * File: Frontend/src/hooks/useGoogleAuth.js
 * ============================================================
 * Wraps @react-oauth/google's useGoogleLogin to handle the
 * full "Continue with Google" flow:
 *   popup → credential → POST /api/auth/google → JWT → redirect
 * ============================================================
 */

import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../api/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function useGoogleAuth() {
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: () => {
      toast.error("Please use the Google button to sign in.");
    },
    onError: () => toast.error("Google sign-in was cancelled"),
  });

  /**
   * Handle the credential response from GoogleLogin component.
   * This is the primary flow used by the app.
   */
  const handleCredentialResponse = async (credentialResponse) => {
    try {
      const res = await googleLogin({
        credential: credentialResponse.credential,
      });

      if (res.success) {
        setAuthData(res.data.token, res.data.user);
        toast.success(res.message || "Signed in with Google!");
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Google sign-in failed");
      }
    } catch (error) {
      const msg =
        error.response?.data?.message || "Google sign-in failed. Try again.";
      toast.error(msg);
    }
  };

  return { login, handleCredentialResponse };
}
