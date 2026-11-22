export interface RepairNoteDeviceSectionProps {
  brand: string;
  model: string;
  reportedFailure: string;
  serviceTypeIds: string[];
  deviceOff: boolean;
  knownBrands: string[];
  saving: boolean;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onReportedFailureChange: (value: string) => void;
  onServiceTypeIdsChange: (serviceTypeIds: string[]) => void;
  onDeviceOffChange: (value: boolean) => void;
}
