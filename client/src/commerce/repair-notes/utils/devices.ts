import type { RepairNoteDevice } from "../types/repair-notes";

export const EMPTY_DEVICE: RepairNoteDevice = {
  brand: "",
  model: "",
  reportedFailure: "",
  deviceOff: false,
  serviceTypeIds: [],
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

export const deviceServiceTypeNames = (
  devices: Pick<RepairNoteDevice, "serviceTypeIds">[],
  serviceTypes: { id: string; name: string }[],
): string[][] => {
  const nameById = new Map(serviceTypes.map((t) => [t.id, t.name]));
  return devices.map((d) =>
    (d.serviceTypeIds ?? []).map((id) => nameById.get(id)).filter((n): n is string => Boolean(n)),
  );
};

export const uniqueNames = (namesByDevice: string[][]): string[] => [...new Set(namesByDevice.flat())];
