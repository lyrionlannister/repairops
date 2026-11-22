import { RefreshCw } from "lucide-react";

import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";

import { useWhatsappOfficialPage } from "../hooks/use-whatsapp-official-page";
import { TemplateCatalogSection } from "../components/template-catalog-section";
import { ConnectAccountModal } from "../components/connect-account-modal";
import { AccountStatusCard } from "../components/account-status-card";

export const WhatsappOfficialPage = () => {
  const page = useWhatsappOfficialPage();

  return (
    <PageShell
      title="WhatsApp"
      description="Tu cuenta oficial de WhatsApp Business y las plantillas aprobadas por Meta."
      action={
        <Button variant="outline" onClick={page.sync} disabled={page.templatesLoading}>
          <RefreshCw className={`mr-1.5 size-4 ${page.templatesLoading ? "animate-spin" : ""}`} />
          {page.templatesLoading ? "Sincronizando..." : "Sincronizar con Meta"}
        </Button>
      }
    >
      <AccountStatusCard
        account={page.account}
        loading={page.accountLoading}
        canConnect={page.canConnect}
        onConnect={page.openConnect}
      />

      <ConnectAccountModal
        isOpen={page.isConnectOpen}
        onClose={page.closeConnect}
        form={page.connectForm}
        onFormChange={page.setConnectForm}
        connecting={page.connecting}
        onSubmit={page.submitConnect}
      />

      {/* key: remontar al conectar cuenta propia recarga las plantillas que el backend copió. */}
      <TemplateCatalogSection
        key={page.catalogReadOnly ? "read-only" : "manageable"}
        scope="tenant"
        title="Plantillas de la empresa"
        description={
          page.catalogReadOnly
            ? "Plantillas del sistema que usa la cuenta piloto compartida. Conecta tu propia cuenta para administrarlas."
            : "Plantillas de tu taller. Se sincronizan con tu cuenta de WhatsApp Business."
        }
        readOnly={page.catalogReadOnly}
        statusByEntryId={page.statusByEntryId}
      />

      {page.canManageSystemTemplates && (
        <TemplateCatalogSection
          scope="system"
          title="Plantillas de sistema"
          description="Plantillas generales del sistema, compartidas por todos los talleres. Aún sin sincronizar con Meta."
        />
      )}
    </PageShell>
  );
};
