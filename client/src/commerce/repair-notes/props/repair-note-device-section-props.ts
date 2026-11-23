import type { RepairNoteDevice } from "../types/repair-notes";

export interface RepairNoteDeviceSectionProps {
  devices: RepairNoteDevice[];
  knownBrands: string[];
  saving: boolean;
  onDeviceChange: (index: number, patch: Partial<RepairNoteDevice>) => void;
  onAddDevice: () => void;
  onRemoveDevice: (index: number) => void;
}
