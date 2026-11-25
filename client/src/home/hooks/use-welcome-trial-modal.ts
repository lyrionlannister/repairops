import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

// Stripe vuelve del Checkout a /home?trial=started -- se muestra una sola vez
// (firedRef) y se limpia el query param, así un refresh no repite el modal.
export const useWelcomeTrialModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fired = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (fired.current || searchParams.get("trial") !== "started") return;
    fired.current = true;
    setIsOpen(true);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("trial");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  return { isOpen, onClose: () => setIsOpen(false) };
};
