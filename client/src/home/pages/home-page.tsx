import { Navigate } from "react-router";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useHomeRedirect } from "../hooks/use-home-redirect";
import { useWelcomeTrialModal } from "../hooks/use-welcome-trial-modal";
import { DashboardHome } from "../components/dashboard-home";
import { WelcomeTrialModal } from "../components/welcome-trial-modal";

export const HomePage: React.FC = () => {
  const redirectTo = useHomeRedirect();
  const { isOpen, onClose } = useWelcomeTrialModal();
  if (redirectTo === undefined)
    return (
      <>
        <DashboardHome />
        <WelcomeTrialModal isOpen={isOpen} onClose={onClose} />
      </>
    );
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return (
    <PageShell title="Sin acceso" description="Tu usuario no tiene módulos asignados.">
      {null}
    </PageShell>
  );
};
