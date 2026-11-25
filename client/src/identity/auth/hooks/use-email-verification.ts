import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useApiClient } from "../../../core/common/hooks/use-api-client";
import { AUTH_REDIRECT_DELAY_MS } from "../constants/auth.constants";
import type { ResendVerificationResponse, VerifyEmailResponse } from "../types/email-verification";
import { apiErrorText } from "@common/utils/api-error";

type Status = "idle" | "verifying" | "verified" | "error";

export const useEmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient } = useApiClient();
  // Precarga el código si vino del botón del correo, pero nunca confirma
  // sola al cargar: necesita el clic (ver resend.client.ts -- evita que un
  // escaneo automático de seguridad del correo queme el código).
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const safeReadJson = async <T>(response: Response): Promise<T | null> => {
    const raw = await response.text();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const confirm = async () => {
    setStatus("verifying");
    setError(null);
    try {
      const response = await apiClient("/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const errorData = await safeReadJson<{ error?: string }>(response);
        throw new Error(apiErrorText(errorData, "El código de verificación es inválido o expiró."));
      }
      const result = await safeReadJson<VerifyEmailResponse>(response);
      if (!result?.user) {
        throw new Error("Respuesta inválida del servidor al verificar el correo.");
      }
      sessionStorage.setItem("user", JSON.stringify(result.user));
      setStatus("verified");
      setTimeout(() => {
        navigate("/identity/onboarding", { replace: true });
      }, AUTH_REDIRECT_DELAY_MS);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "El código de verificación es inválido o expiró.",
      );
    }
  };

  const resend = async () => {
    setResending(true);
    setResent(false);
    setError(null);
    try {
      const response = await apiClient("/auth/resend-verification", { method: "POST" });
      if (!response.ok) {
        const errorData = await safeReadJson<{ error?: string }>(response);
        throw new Error(apiErrorText(errorData, "No se pudo reenviar el correo"));
      }
      await safeReadJson<ResendVerificationResponse>(response);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el correo");
    } finally {
      setResending(false);
    }
  };

  return { code, setCode, status, error, confirm, resend, resending, resent };
};
