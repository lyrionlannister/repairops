import { Link } from "react-router";
import { MailCheck } from "lucide-react";
import { OtpInput } from "../../../core/common/components/ui/inputs/otp-input";
import { Button } from "../../../core/common/components/ui/button/button";
import type { EmailVerificationStatusProps } from "../props/email-verification-status-props";

export const EmailVerificationStatus: React.FC<EmailVerificationStatusProps> = ({
  code,
  setCode,
  status,
  error,
  confirm,
  resend,
  resending,
  resent,
}) => {
  if (status === "verified") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="size-10 text-success-500" />
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
          Correo verificado
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ya puedes continuar con tu registro.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <MailCheck className="size-10 text-brand-500" />
      <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
        Verifica tu correo
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Te mandamos un código de 6 dígitos. Escríbelo aquí o usa el botón del correo.
      </p>

      <OtpInput
        value={code}
        onChange={setCode}
        disabled={status === "verifying"}
        error={status === "error"}
        autoFocus
      />

      <Button
        onClick={confirm}
        disabled={status === "verifying" || code.length !== 6}
        variant="primary"
      >
        {status === "verifying" ? "Verificando..." : "Confirmar correo"}
      </Button>

      {error && <p className="text-sm text-error-500">{error}</p>}

      <Button onClick={resend} disabled={resending} variant="outline">
        {resending ? "Reenviando..." : "Reenviar código"}
      </Button>
      {resent && (
        <p className="text-sm text-success-500">Te mandamos un nuevo código, revisa tu correo.</p>
      )}

      <Link
        to="/identity/sign-in"
        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
      >
        Volver a iniciar sesión
      </Link>
    </div>
  );
};
