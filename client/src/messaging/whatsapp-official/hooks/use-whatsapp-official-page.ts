import { useEffect, useState } from "react";
import { usePermissions } from "@common/hooks/use-permissions";
import { useCurrentUser } from "@common/hooks/use-current-user";
import { useWhatsappAccount } from "./use-whatsapp-account";
import { useWhatsappTemplates } from "./use-whatsapp-templates";
import { useTemplateStatusByEntry } from "./use-template-status-by-entry";
import { useWhatsappPackages } from "../../../app_platform/billing/hooks/use-whatsapp-packages";
import { EMPTY_CONNECT_FORM } from "../utils/format";

export const useWhatsappOfficialPage = () => {
  const { can } = usePermissions();
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
  const statusByEntryId = useTemplateStatusByEntry(templates);
  const whatsappPackages = useWhatsappPackages();

  useEffect(() => {
    fetchStatus();
    sync();
  }, [fetchStatus, sync]);

  const openConnect = () => {
    setConnectForm(EMPTY_CONNECT_FORM);
    setIsConnectOpen(true);
  };

  const submitConnect = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await connectAccount(connectForm)) {
      setIsConnectOpen(false);
      setConnectForm(EMPTY_CONNECT_FORM);
      sync();
    }
  };

  return {
    account,
    accountLoading,
    templatesLoading,
    sync,
    statusByEntryId,
    whatsappPackages,
    // Sin cuenta propia el taller solo ve las plantillas de sistema; al conectar la suya,
    // el backend le copia esas plantillas y ya puede administrarlas.
    catalogReadOnly: account?.ownedByPlatform !== false,
    canManageSystemTemplates: can("platform.templates.manage"),
    // El admin de plataforma no "conecta su propia cuenta": la cuenta piloto
    // compartida ya es la cuenta de la plataforma, el solo la administra.
    canConnect: can("whatsapp.manage") && !currentUser?.isPlatformAdmin,
    isConnectOpen,
    connectForm,
    connecting,
    setConnectForm,
    openConnect,
    closeConnect: () => setIsConnectOpen(false),
    submitConnect,
  };
};
