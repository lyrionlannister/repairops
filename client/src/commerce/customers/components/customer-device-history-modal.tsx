import type { FC } from "react";
import { Modal } from "@ui/modal/modal";
import { Button } from "@ui/button/button";
import { formatDate } from "../utils/format";
import type { CustomerDeviceHistoryModalProps } from "../props/customer-device-history-modal-props";

export const CustomerDeviceHistoryModal: FC<CustomerDeviceHistoryModalProps> = ({
  historyCustomer,
  devices,
  onClose,
}) => (
  <Modal isOpen={Boolean(historyCustomer)} onClose={onClose} className="max-w-lg p-6 sm:p-8 mx-4">
    <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">Historial de equipos</h2>
    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{historyCustomer?.name}</p>

    {devices.length === 0 ? (
      <p className="text-sm text-gray-400">Este cliente todavía no tiene notas de reparación registradas.</p>
    ) : (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {devices.map((device) => (
          <li key={`${device.brand}-${device.model}`} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {device.brand} {device.model}
              </p>
              <p className="text-xs text-gray-400">
                {device.notesCount} {device.notesCount === 1 ? "nota" : "notas"} · última:{" "}
                {formatDate(device.lastReceivedAt)} (#{device.controlNumber})
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}

    <div className="flex justify-end pt-4">
      <Button type="button" variant="outline" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  </Modal>
);
