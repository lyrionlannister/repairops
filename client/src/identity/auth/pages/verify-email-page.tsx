import { AuthLayout } from "../components/auth-layout";
import { EmailVerificationStatus } from "../components/email-verification-status";
import { PageMeta } from "../../../core/common/pages/page-meta";
import { useEmailVerification } from "../hooks/use-email-verification";

export const VerifyEmailPage: React.FC = () => {
  const { code, setCode, status, error, confirm, resend, resending, resent } =
    useEmailVerification();

  return (
    <>
      <PageMeta title="Verifica tu correo" description="Verifica tu correo para continuar" />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto">
            <EmailVerificationStatus
              code={code}
              setCode={setCode}
              status={status}
              error={error}
              confirm={confirm}
              resend={resend}
              resending={resending}
              resent={resent}
            />
          </div>
        </div>
      </AuthLayout>
    </>
  );
};
