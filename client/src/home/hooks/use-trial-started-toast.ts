import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useToast } from "@common/hooks/use-toast";

// Stripe vuelve del Checkout a /home?trial=started -- se muestra una sola vez
// (firedRef) y se limpia el query param, así un refresh no repite el toast.
export const useTrialStartedToast = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || searchParams.get("trial") !== "started") return;
    fired.current = true;

    showToast({
      title: "¡Bienvenido a RepairOps!",
      message: "Tu prueba de 14 días ya comenzó. No se cobra nada hasta que termine.",
      variant: "success",
      durationMs: 8000,
    });

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("trial");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, showToast]);
};
