import type { RepairNoteDevice } from "../types/repair-notes";

export interface RepairNoteDeviceSectionProps {
  devices: RepairNoteDevice[];
  serviceTypeIds: string[];
  knownBrands: string[];
  saving: boolean;
  onDeviceChange: (index: number, patch: Partial<RepairNoteDevice>) => void;
  onAddDevice: () => void;
  onRemoveDevice: (index: number) => void;
  onServiceTypeIdsChange: (serviceTypeIds: string[]) => void;
}
