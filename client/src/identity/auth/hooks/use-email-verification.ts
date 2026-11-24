import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useApiClient } from "../../../core/common/hooks/use-api-client";
import { AUTH_REDIRECT_DELAY_MS } from "../constants/auth.constants";
import type { ResendVerificationResponse, VerifyEmailResponse } from "../types/email-verification";

type Status = "checking" | "pending" | "verified" | "error";

export const useEmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient } = useApiClient();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "checking" : "pending");
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

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const response = await apiClient("/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          const errorData = await safeReadJson<{ error?: string }>(response);
          throw new Error(errorData?.error || "El enlace de verificación es inválido o expiró.");
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
          err instanceof Error ? err.message : "El enlace de verificación es inválido o expiró.",
        );
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo corre una vez, al montar con el token de la URL.
  }, []);

  const resend = async () => {
    setResending(true);
    setResent(false);
    setError(null);
    try {
      const response = await apiClient("/auth/resend-verification", { method: "POST" });
      if (!response.ok) {
        const errorData = await safeReadJson<{ error?: string }>(response);
        throw new Error(errorData?.error || "No se pudo reenviar el correo");
      }
      await safeReadJson<ResendVerificationResponse>(response);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el correo");
    } finally {
      setResending(false);
    }
  };

  return { status, error, resend, resending, resent };
};
