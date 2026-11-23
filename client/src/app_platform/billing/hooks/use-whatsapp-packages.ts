import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { usePermissions } from "@common/hooks/use-permissions";
import type {
  BillingPortalResponse,
  WhatsappPackageCheckoutResponse,
  WhatsappPackageOption,
  WhatsappPackageSize,
} from "../types/whatsapp-package";

export const useWhatsappPackages = () => {
  const { apiClient } = useApiClient();
  const { can } = usePermissions();
  const canRead = can("billing.read");
  const canManage = can("billing.manage");
  const [packages, setPackages] = useState<WhatsappPackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingSize, setBuyingSize] = useState<WhatsappPackageSize | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const response = await apiClient("/billing/whatsapp-packages");
      if (!active) return;
      if (response.ok) setPackages(await response.json());
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [apiClient, canRead]);

  // Igual patrón que el Checkout de planes en onboarding: la API crea la
  // sesión de Stripe y el navegador salta directo a ella.
  const buyPackage = useCallback(
    async (size: WhatsappPackageSize) => {
      setBuyingSize(size);
      setError(null);
      const response = await apiClient(`/billing/whatsapp-packages/${size}/checkout`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "No se pudo iniciar el pago");
        setBuyingSize(null);
        return;
      }
      const { checkoutUrl }: WhatsappPackageCheckoutResponse = await response.json();
      window.location.href = checkoutUrl;
    },
    [apiClient],
  );

  const openPortal = useCallback(async () => {
    setPortalLoading(true);
    setError(null);
    const response = await apiClient("/billing/portal", { method: "POST" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "No se pudo abrir el portal de suscripción");
      setPortalLoading(false);
      return;
    }
    const { url }: BillingPortalResponse = await response.json();
    window.location.href = url;
  }, [apiClient]);

  return {
    visible: canRead,
    canManage,
    packages,
    loading,
    buyingSize,
    portalLoading,
    error,
    buyPackage,
    openPortal,
  };
};
