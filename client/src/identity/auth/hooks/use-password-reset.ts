import { useState } from "react";
import { useSearchParams } from "react-router";
import { useApiClient } from "../../../core/common/hooks/use-api-client";
import { readApiError } from "@common/utils/api-error";
import type { PasswordResetStatus } from "../types/password-reset";

const MIN_PASSWORD_LENGTH = 8;

export const useForgotPassword = () => {
  const { apiClient } = useApiClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<PasswordResetStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setStatus("sending");
    setError(null);
    try {
      const response = await apiClient("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "No pudimos enviar el correo."));
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el correo.");
      setStatus("error");
    }
  };

  return { email, setEmail, status, error, submit };
};

export const useResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { apiClient } = useApiClient();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<PasswordResetStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmation.length > 0 && password !== confirmation;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    Boolean(token) && password.length >= MIN_PASSWORD_LENGTH && password === confirmation;

  const submit = async () => {
    if (!canSubmit) return;
    setStatus("sending");
    setError(null);
    try {
      const response = await apiClient("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "No pudimos cambiar tu contraseña."));
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cambiar tu contraseña.");
      setStatus("error");
    }
  };

  return {
    hasToken: Boolean(token),
    password,
    setPassword,
    confirmation,
    setConfirmation,
    mismatch,
    tooShort,
    canSubmit,
    status,
    error,
    submit,
  };
};
