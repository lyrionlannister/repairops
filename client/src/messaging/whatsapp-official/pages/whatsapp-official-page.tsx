import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { useWhatsappAccount } from "../hooks/use-whatsapp-account";
import { useWhatsappTemplates } from "../hooks/use-whatsapp-templates";
import { useCurrentUser } from "@common/hooks/use-current-user";
import { Badge } from "@ui/badge/badge";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Modal } from "@ui/modal/modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { TemplateCatalogSection } from "../components/template-catalog-section";
import { useTemplateStatusByEntry } from "../hooks/use-template-status-by-entry";
import { EMPTY_CONNECT_FORM } from "../utils/format";

export const WhatsappOfficialPage = () => {
  const currentUser = useCurrentUser();
  const {
    account,
    loading: accountLoading,
    fetchStatus,
    connecting,
    connectAccount,
  } = useWhatsappAccount();
  const { templates, loading: templatesLoading, sync } = useWhatsappTemplates();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectForm, setConnectForm] = useState(EMPTY_CONNECT_FORM);

  useEffect(() => {
    fetchStatus();
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await connectAccount(connectForm);
    if (ok) {
      setIsConnectOpen(false);
      setConnectForm(EMPTY_CONNECT_FORM);
      sync();
    }
  };

  const statusByEntryId = useTemplateStatusByEntry(templates);

  return (
    <PageShell
      title="WhatsApp"
      description="Tu cuenta oficial de WhatsApp Business y las plantillas aprobadas por Meta."
      action={
        <Button variant="outline" onClick={sync} disabled={templatesLoading}>
          <RefreshCw className={`mr-1.5 size-4 ${templatesLoading ? "animate-spin" : ""}`} />
          {templatesLoading ? "Sincronizando..." : "Sincronizar con Meta"}
        </Button>
      }
    >

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center justify-between">
          <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Cuenta conectada</h2>
          <Button
            variant="outline"
            onClick={() => {
              setConnectForm(EMPTY_CONNECT_FORM);
              setIsConnectOpen(true);
            }}
          >
            Usar mi propia cuenta
          </Button>
        </div>
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

      <Modal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        className="max-w-md p-6 sm:p-8 mx-4"
      >
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Conectar cuenta propia</h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Pega las credenciales de tu WABA generadas en Meta Business Manager. Usa un token de
          sistema permanente, no uno de usuario de corta duración -- se validan contra Meta antes de
          guardarse.
        </p>
        <form onSubmit={handleConnectAccount} className="mt-4 space-y-4">
          <div>
            <Label className="text-gray-500">WABA ID</Label>
            <Input
              value={connectForm.wabaId}
              onChange={(event) => setConnectForm((prev) => ({ ...prev, wabaId: event.target.value }))}
              required
              disabled={connecting}
            />
          </div>
          <div>
            <Label className="text-gray-500">Phone Number ID</Label>
            <Input
              value={connectForm.phoneNumberId}
              onChange={(event) => setConnectForm((prev) => ({ ...prev, phoneNumberId: event.target.value }))}
              required
              disabled={connecting}
            />
          </div>
          <div>
            <Label className="text-gray-500">Access Token</Label>
            <Input
              type="password"
              value={connectForm.accessToken}
              onChange={(event) => setConnectForm((prev) => ({ ...prev, accessToken: event.target.value }))}
              required
              disabled={connecting}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setIsConnectOpen(false)} disabled={connecting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={connecting}>
              {connecting ? "Validando con Meta..." : "Conectar"}
            </Button>
          </div>
        </form>
      </Modal>

      <TemplateCatalogSection
        scope="tenant"
        title="Plantillas de la empresa"
        description="Plantillas de tu taller. Se sincronizan con tu cuenta de WhatsApp Business."
        statusByEntryId={statusByEntryId}
      />

      {currentUser?.isPlatformAdmin && (
        <TemplateCatalogSection
          scope="system"
          title="Plantillas de sistema"
          description="Plantillas generales del sistema, compartidas por todos los talleres. Aún sin sincronizar con Meta."
        />
      )}
    </PageShell>
  );
};

