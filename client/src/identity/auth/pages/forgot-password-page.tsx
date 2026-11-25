import type { FC } from "react";
import { AuthLayout } from "../components/auth-layout";
import { ForgotPasswordForm } from "../components/forgot-password-form";
import { PageMeta } from "../../../core/common/pages/page-meta";

export const ForgotPasswordPage: FC = () => (
  <>
    <PageMeta title="Recuperar contraseña" description="Recupera el acceso a tu cuenta" />
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  </>
);
