import { PartyPopper } from "lucide-react";
import { Modal } from "../../core/common/components/ui/modal/modal";
import { Button } from "../../core/common/components/ui/button/button";
import type { WelcomeTrialModalProps } from "../props/welcome-trial-modal-props";

export const WelcomeTrialModal: React.FC<WelcomeTrialModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          <PartyPopper className="size-8" />
        </span>
        <h2 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
          ¡Bienvenido a RepairOps!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu prueba de 14 días ya comenzó. No se cobra nada hasta que termine.
        </p>
        <Button variant="primary" className="w-full" onClick={onClose}>
          Empezar a usar RepairOps
        </Button>
      </div>
    </Modal>
  );
};
