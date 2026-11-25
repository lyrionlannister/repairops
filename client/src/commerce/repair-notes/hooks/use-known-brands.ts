import { useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

// Marcas ya usadas en otras notas -- sugerencia, nunca restringe a una
// marca nueva que el cliente trae por primera vez.
export const useKnownBrands = () => {
  const { apiClient } = useApiClient();
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const response = await apiClient("/repair-notes/brands");
      if (active && response.ok) setBrands((await response.json()) as string[]);
    })().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [apiClient]);

  return brands;
};
