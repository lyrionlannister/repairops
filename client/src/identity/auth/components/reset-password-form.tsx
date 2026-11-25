import type { FC } from "react";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { Input } from "../../../core/common/components/ui/inputs/input";
import { Label } from "../../../core/common/components/ui/inputs/label";
import { Button } from "../../../core/common/components/ui/button/button";
import { useResetPassword } from "../hooks/use-password-reset";

const LINK_CLASS = "text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400";
const TITLE_CLASS = "mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90";

export const ResetPasswordForm: FC = () => {
  const {
    hasToken,
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
  } = useResetPassword();
  const sending = status === "sending";

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {status === "sent" ? (
          <div className="text-center sm:text-start">
            <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500">
              <CheckCircle2 className="size-6" />
            </span>
            <h1 className={TITLE_CLASS}>Contraseña actualizada</h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Por seguridad cerramos tus sesiones abiertas. Entra con tu nueva contraseña.
            </p>
            <Link to="/identity/sign-in" className={LINK_CLASS}>
              Iniciar sesión
            </Link>
          </div>
        ) : !hasToken ? (
          <div className="text-center sm:text-start">
            <h1 className={TITLE_CLASS}>Enlace incompleto</h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Abre el enlace completo desde tu correo o pide uno nuevo.
            </p>
            <Link to="/identity/forgot-password" className={LINK_CLASS}>
              Pedir un enlace nuevo
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className={`${TITLE_CLASS} sm:text-title-md`}>Elige una nueva contraseña</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Usa al menos 8 caracteres.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="reset-password" className="text-gray-500">
                  Nueva contraseña <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={sending}
                  error={tooShort}
                  hint={tooShort ? "Debe tener al menos 8 caracteres" : undefined}
                />
              </div>
              <div>
                <Label htmlFor="reset-confirmation" className="text-gray-500">
                  Confirma la contraseña <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="reset-confirmation"
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={sending}
                  error={mismatch}
                  hint={mismatch ? "Las contraseñas no coinciden" : undefined}
                />
              </div>
              {error && (
                <p className="text-sm text-error-500">
                  {error}{" "}
                  <Link to="/identity/forgot-password" className="underline">
                    Pedir un enlace nuevo
                  </Link>
                </p>
              )}
              <Button type="submit" disabled={sending || !canSubmit} className="w-full">
                {sending ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
