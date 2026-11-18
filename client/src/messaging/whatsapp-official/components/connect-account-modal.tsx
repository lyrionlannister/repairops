import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Modal } from "@ui/modal/modal";

import type { EMPTY_CONNECT_FORM } from "../utils/format";

type ConnectAccountForm = typeof EMPTY_CONNECT_FORM;

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ConnectAccountForm;
  onFormChange: (form: ConnectAccountForm) => void;
  connecting: boolean;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}

export const ConnectAccountModal: FC<ConnectAccountModalProps> = ({
  isOpen,
  onClose,
  form,
  onFormChange,
  connecting,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8 mx-4">
    <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
      Conectar cuenta propia
    </h2>
    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
      Pega las credenciales de tu WABA generadas en Meta Business Manager. Usa un token de sistema
      permanente, no uno de usuario de corta duración -- se validan contra Meta antes de guardarse.
    </p>
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <Label className="text-gray-500">WABA ID</Label>
        <Input
          value={form.wabaId}
          onChange={(event) => onFormChange({ ...form, wabaId: event.target.value })}
          required
          disabled={connecting}
        />
      </div>
      <div>
        <Label className="text-gray-500">Phone Number ID</Label>
        <Input
          value={form.phoneNumberId}
          onChange={(event) => onFormChange({ ...form, phoneNumberId: event.target.value })}
          required
          disabled={connecting}
        />
      </div>
      <div>
        <Label className="text-gray-500">Access Token</Label>
        <Input
          type="password"
          value={form.accessToken}
          onChange={(event) => onFormChange({ ...form, accessToken: event.target.value })}
          required
          disabled={connecting}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={connecting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={connecting}>
          {connecting ? "Validando con Meta..." : "Conectar"}
        </Button>
      </div>
    </form>
  </Modal>
);
