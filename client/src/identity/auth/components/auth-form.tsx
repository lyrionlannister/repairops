import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLogin } from "../../../core/common/hooks/use-login";
import { Input } from "../../../core/common/components/ui/inputs/input";
import { Label } from "../../../core/common/components/ui/inputs/label";
import { Button } from "../../../core/common/components/ui/button/button";
import { EyeCloseIcon, EyeIcon } from "../../../core/common/icons";
import { AUTH_REDIRECT_DELAY_MS, INITIAL_AUTH_FORM_DATA } from "../constants/auth.constants";
import { updateAuthFormField } from "../helpers/auth-form.helpers";
import type { LoginPayload } from "../../../core/common/types/login";

export const AuthForm: React.FC = () => {
  const { login, loading, clearError, clearSuccess } = useLogin();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginPayload>(INITIAL_AUTH_FORM_DATA);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => updateAuthFormField(prev, name, value));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    clearSuccess();

    const result = await login(formData);
    if (result) {
      // Onboarding sin terminar (sin plan o Checkout sin completar): de
      // vuelta a elegir/reanudar plan, nunca al home.
      const target = result.user.subscriptionStatus === "incomplete" ? "/identity/onboarding" : "/";
      setTimeout(() => {
        navigate(target, { replace: true });
      }, AUTH_REDIRECT_DELAY_MS);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Ingresa a tu cuenta
            </h1>
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-500">
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label className="text-gray-500">
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button type="submit" disabled={loading} className="w-full" variant="primary">
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              ¿No tienes cuenta?{" "}
              <Link
                to="/identity/sign-up"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
