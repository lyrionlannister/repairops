import type { RepairNoteDevice } from "../types/repair-notes";

export const EMPTY_DEVICE: RepairNoteDevice = {
  brand: "",
  model: "",
  reportedFailure: "",
  deviceOff: false,
};

export const describeDevices = (devices: Pick<RepairNoteDevice, "brand" | "model">[]): string =>
  devices.map((d) => `${d.brand} ${d.model}`.trim()).join(", ");

export const updateDeviceAt = (
  devices: RepairNoteDevice[],
  index: number,
  patch: Partial<RepairNoteDevice>,
): RepairNoteDevice[] => devices.map((d, i) => (i === index ? { ...d, ...patch } : d));

export const removeDeviceAt = (devices: RepairNoteDevice[], index: number): RepairNoteDevice[] =>
  devices.length > 1 ? devices.filter((_, i) => i !== index) : devices;
