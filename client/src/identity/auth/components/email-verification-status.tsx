import { Link } from "react-router";
import { MailCheck, MailWarning } from "lucide-react";
import { Button } from "../../../core/common/components/ui/button/button";
import { Loader } from "../../../core/common/components/ui/loader/loader";
import type { EmailVerificationStatusProps } from "../props/email-verification-status-props";

export const EmailVerificationStatus: React.FC<EmailVerificationStatusProps> = ({
  status,
  error,
  resend,
  resending,
  resent,
}) => {
  if (status === "checking") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader />
        <p className="text-sm text-gray-500 dark:text-gray-400">Verificando tu correo...</p>
      </div>
    );
  }

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

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailWarning className="size-10 text-error-500" />
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
          No se pudo verificar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Button onClick={resend} disabled={resending} variant="primary">
          {resending ? "Reenviando..." : "Reenviar correo de verificación"}
        </Button>
        {resent && (
          <p className="text-sm text-success-500">Te mandamos un nuevo enlace, revisa tu correo.</p>
        )}
        <Link
          to="/identity/sign-in"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <MailCheck className="size-10 text-brand-500" />
      <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
        Revisa tu correo
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Te mandamos un enlace para verificar tu correo. Ábrelo para continuar con el registro.
      </p>
      <Button onClick={resend} disabled={resending} variant="primary">
        {resending ? "Reenviando..." : "Reenviar correo"}
      </Button>
      {resent && (
        <p className="text-sm text-success-500">Te mandamos un nuevo enlace, revisa tu correo.</p>
      )}
      {error && <p className="text-sm text-error-500">{error}</p>}
      <Link
        to="/identity/sign-in"
        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
      >
        Volver a iniciar sesión
      </Link>
    </div>
  );
};
