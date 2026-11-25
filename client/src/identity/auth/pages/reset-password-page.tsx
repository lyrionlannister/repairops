import type { FC } from "react";
import { AuthLayout } from "../components/auth-layout";
import { ResetPasswordForm } from "../components/reset-password-form";
import { PageMeta } from "../../../core/common/pages/page-meta";

export const ResetPasswordPage: FC = () => (
  <>
    <PageMeta title="Nueva contraseña" description="Elige una nueva contraseña" />
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  </>
);
