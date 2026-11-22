import type { FC } from "react";

import { Badge } from "@ui/badge/badge";
import { Button } from "@ui/button/button";

import type { WhatsappAccountStatus } from "../hooks/use-whatsapp-account";

interface AccountStatusCardProps {
  account: WhatsappAccountStatus | null;
  loading: boolean;
  canConnect: boolean;
  onConnect: () => void;
}

export const AccountStatusCard: FC<AccountStatusCardProps> = ({ account, loading, canConnect, onConnect }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <div className="flex items-center justify-between">
      <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Cuenta conectada</h2>
      {canConnect && (
        <Button variant="outline" onClick={onConnect}>
          Usar mi propia cuenta
        </Button>
      )}
    </div>
    {loading ? (
      <p className="text-sm text-gray-400">Cargando...</p>
    ) : account ? (
      <div className="flex items-center gap-3">
        <Badge color={account.status === "connected" ? "success" : "error"}>
          {account.status === "connected" ? "Conectada" : "Desconectada"}
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-300">{account.phoneNumberId}</span>
        {account.ownedByPlatform && <span className="text-xs text-gray-400">(cuenta piloto compartida)</span>}
      </div>
    ) : (
      <p className="text-sm text-gray-400">Sin información todavía.</p>
    )}
  </div>
);
