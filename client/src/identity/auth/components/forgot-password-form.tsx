import type { FC } from "react";
import { Link } from "react-router";
import { MailCheck } from "lucide-react";
import { Input } from "../../../core/common/components/ui/inputs/input";
import { Label } from "../../../core/common/components/ui/inputs/label";
import { Button } from "../../../core/common/components/ui/button/button";
import { useForgotPassword } from "../hooks/use-password-reset";

const LINK_CLASS = "text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400";

export const ForgotPasswordForm: FC = () => {
  const { email, setEmail, status, error, submit } = useForgotPassword();
  const sending = status === "sending";

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {status === "sent" ? (
          <div className="text-center sm:text-start">
            <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500">
              <MailCheck className="size-6" />
            </span>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90">
              Revisa tu correo
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Si <strong className="text-gray-700 dark:text-gray-300">{email}</strong> tiene una
              cuenta, te enviamos un enlace para elegir una nueva contraseña. El enlace vence en 1
              hora.
            </p>
            <Link to="/identity/sign-in" className={LINK_CLASS}>
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Escribe el correo con el que entras y te enviaremos un enlace para cambiarla.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="forgot-email" className="text-gray-500">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                  error={Boolean(error)}
                  hint={error ?? undefined}
                />
              </div>
              <Button type="submit" disabled={sending || !email.trim()} className="w-full">
                {sending ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
            <p className="mt-5 text-center sm:text-start">
              <Link to="/identity/sign-in" className={LINK_CLASS}>
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
