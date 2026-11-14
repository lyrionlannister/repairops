import { useEffect } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";

import { useWhatsappAccount } from "../hooks/use-whatsapp-account";
import { useWhatsappTemplates, type WhatsappTemplateSyncStatus } from "../hooks/use-whatsapp-templates";
import Alert from "@ui/alert/alert";
import Badge from "@ui/badge/badge";
import Button from "@ui/button/button";
import PageMeta from "@common/pages/page-meta";

// Etiqueta legible por catalogKey -- el catálogo real vive en el backend
// (templates/catalog.ts), aquí solo se traduce para mostrarlo.
const CATALOG_LABELS: Record<string, string> = {
  order_ready: "Aviso de orden lista",
};

const STATUS_BADGE: Record<WhatsappTemplateSyncStatus, { label: string; color: "success" | "warning" | "error" }> = {
  APPROVED: { label: "Aprobada", color: "success" },
  PENDING: { label: "Pendiente de Meta", color: "warning" },
  REJECTED: { label: "Rechazada", color: "error" },
};

const WhatsappOfficialPage = () => {
  const { account, loading: accountLoading, error: accountError, fetchStatus } = useWhatsappAccount();
  const { templates, loading: templatesLoading, error: templatesError, sync } = useWhatsappTemplates();

  useEffect(() => {
    fetchStatus();
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageMeta title="WhatsApp" description="Estado de la cuenta oficial y catálogo de plantillas" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">WhatsApp</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cuenta oficial (Graph API) y plantillas proactivas aprobadas por Meta.
          </p>
        </div>
        <Button variant="outline" onClick={sync} disabled={templatesLoading}>
          <RefreshCw className={`mr-1.5 size-4 ${templatesLoading ? "animate-spin" : ""}`} />
          {templatesLoading ? "Sincronizando..." : "Sincronizar con Meta"}
        </Button>
      </div>

      {accountError && <Alert variant="error" title="Error" message={accountError} />}
      {templatesError && <Alert variant="error" title="Error al sincronizar" message={templatesError} />}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Cuenta conectada</h2>
        {accountLoading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : account ? (
          <div className="flex items-center gap-3">
            <Badge color={account.status === "connected" ? "success" : "error"}>
              {account.status === "connected" ? "Conectada" : "Desconectada"}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">{account.phoneNumberId}</span>
            {account.ownedByPlatform && (
              <span className="text-xs text-gray-400">(cuenta piloto compartida)</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin información todavía.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Plantillas proactivas</h2>
        </div>
        {templatesLoading && templates.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Sincronizando con Meta...</div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
            <MessageCircle className="size-10 opacity-40" />
            <p className="text-sm">Sin plantillas todavía.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/2">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Plantilla</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status en Meta</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Última sincronización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {templates.map((template) => {
                const badge = STATUS_BADGE[template.status];
                return (
                  <tr key={template.id}>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {CATALOG_LABELS[template.catalogKey] ?? template.catalogKey}
                    </td>
                    <td className="px-5 py-4">
                      <Badge color={badge.color}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {template.lastSyncedAt ? new Date(template.lastSyncedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WhatsappOfficialPage;
