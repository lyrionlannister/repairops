import type { RepairNoteDevice } from "../entities/repair-note-device.entity.js";
import { BusinessError } from "../../../core/http/business-error.js";

export interface RepairNoteDeviceInput {
  brand: string;
  model: string;
  reportedFailure: string;
  deviceOff?: boolean;
  serviceTypeIds?: string[];
}

export type RepairNoteDeviceView = Pick<
  RepairNoteDevice,
  "brand" | "model" | "reportedFailure" | "deviceOff"
> & {
  serviceTypeIds: string[];
};

const MAX_DEVICES = 50;

export function normalizeDevices(devices: unknown): RepairNoteDeviceView[] {
  if (!Array.isArray(devices) || devices.length === 0)
    throw new BusinessError("La nota debe tener al menos un equipo");
  if (devices.length > MAX_DEVICES)
    throw new BusinessError(`Una nota admite hasta ${MAX_DEVICES} equipos`);
  return devices.map((raw: Partial<RepairNoteDeviceInput> | null, index) => {
    const label = devices.length > 1 ? ` del equipo ${index + 1}` : " del equipo";
    const brand = typeof raw?.brand === "string" ? raw.brand.trim() : "";
    const model = typeof raw?.model === "string" ? raw.model.trim() : "";
    const reportedFailure =
      typeof raw?.reportedFailure === "string" ? raw.reportedFailure.trim() : "";
    if (!brand) throw new BusinessError(`La marca${label} es obligatoria`);
    if (!model) throw new BusinessError(`El modelo${label} es obligatorio`);
    if (!reportedFailure) throw new BusinessError(`La falla reportada${label} es obligatoria`);
    if (brand.length > 255 || model.length > 255)
      throw new BusinessError(`La marca y el modelo${label} admiten hasta 255 caracteres`);
    const serviceTypeIds = raw?.serviceTypeIds ?? [];
    if (
      !Array.isArray(serviceTypeIds) ||
      !serviceTypeIds.every((id) => typeof id === "string" && /^\d+$/.test(id))
    ) {
      throw new BusinessError(`Los tipos de servicio${label} son inválidos`);
    }
    return {
      brand,
      model,
      reportedFailure,
      deviceOff: raw?.deviceOff === true,
      serviceTypeIds: [...new Set(serviceTypeIds)],
    };
  });
}

export function toDeviceView(
  device: RepairNoteDevice,
  serviceTypeIds: string[] = [],
): RepairNoteDeviceView {
  return {
    brand: device.brand,
    model: device.model,
    reportedFailure: device.reportedFailure,
    deviceOff: device.deviceOff,
    serviceTypeIds,
  };
}

export function describeDevices(devices: Pick<RepairNoteDeviceView, "brand" | "model">[]): string {
  return devices.map((d) => `${d.brand} ${d.model}`.trim()).join(", ");
}
