import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useApiClient } from "./use-api-client";

// La cookie es httpOnly: JS no puede borrarla, solo pedirle a la API que
// mande el Set-Cookie de limpieza (ver auth.controller.ts logout).
export const useLogout = () => {
  const { apiClient } = useApiClient();
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.clear();
      navigate("/identity/sign-in", { replace: true });
    }
  }, [apiClient, navigate]);
};
