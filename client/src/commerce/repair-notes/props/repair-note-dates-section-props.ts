export interface RepairNoteDatesSectionProps {
  receivedAt: string;
  deliveryDate: string;
  assignedEmployeeId: string;
  technicianNotes: string;
  additionalFindings: string;
  isEdit: boolean;
  saving: boolean;
  onReceivedAtChange: (value: string) => void;
  onDeliveryDateChange: (value: string) => void;
  onAssignedEmployeeIdChange: (value: string) => void;
  onTechnicianNotesChange: (value: string) => void;
  onAdditionalFindingsChange: (value: string) => void;
}
