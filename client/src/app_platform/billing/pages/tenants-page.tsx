import { useEffect } from "react";
import { useNavigate } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";
import { Button } from "@ui/button/button";

import { usePlatformTenants } from "../hooks/use-platform-tenants";
import { TenantsTable } from "../components/tenants-table";

export const TenantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenants, loading, error, fetchAll } = usePlatformTenants();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <PageShell title="Talleres" description="Plan, extras y uso de cada taller de la plataforma.">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <p className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Cargando talleres...
          </p>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="text-sm text-error-500">{error}</p>
            <Button variant="secondary" onClick={fetchAll}>
              Reintentar
            </Button>
          </div>
        ) : (
          <TenantsTable
            tenants={tenants}
            onEdit={(tenantId) => navigate(`/platform/tenants/${tenantId}/edit`)}
          />
        )}
      </div>
    </PageShell>
  );
};
