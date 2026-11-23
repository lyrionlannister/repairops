import { Navigate } from "react-router";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useHomeRedirect } from "../hooks/use-home-redirect";
import { useTrialStartedToast } from "../hooks/use-trial-started-toast";
import { DashboardHome } from "../components/dashboard-home";

export const HomePage: React.FC = () => {
  const redirectTo = useHomeRedirect();
  useTrialStartedToast();
  if (redirectTo === undefined) return <DashboardHome />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return (
    <PageShell title="Sin acceso" description="Tu usuario no tiene módulos asignados.">
      {null}
    </PageShell>
  );
};
