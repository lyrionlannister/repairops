import { useEffect, useState } from "react";
import { usePermissions } from "@common/hooks/use-permissions";
import { useWhatsappAccount } from "./use-whatsapp-account";
import { useWhatsappTemplates } from "./use-whatsapp-templates";
import { useTemplateStatusByEntry } from "./use-template-status-by-entry";
import { EMPTY_CONNECT_FORM } from "../utils/format";

export const useWhatsappOfficialPage = () => {
  const { can } = usePermissions();
  const { account, loading: accountLoading, fetchStatus, connecting, connectAccount } = useWhatsappAccount();
  const { templates, loading: templatesLoading, sync } = useWhatsappTemplates();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectForm, setConnectForm] = useState(EMPTY_CONNECT_FORM);
  const statusByEntryId = useTemplateStatusByEntry(templates);

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
    // Sin cuenta propia el taller solo ve las plantillas de sistema; al conectar la suya,
    // el backend le copia esas plantillas y ya puede administrarlas.
    catalogReadOnly: account?.ownedByPlatform !== false,
    canManageSystemTemplates: can("platform.templates.manage"),
    canConnect: can("whatsapp.manage"),
    isConnectOpen,
    connectForm,
    connecting,
    setConnectForm,
    openConnect,
    closeConnect: () => setIsConnectOpen(false),
    submitConnect,
  };
};
