export interface ServiceTypeMultiSelectProps {
  value: string[];
  onChange: (serviceTypeIds: string[]) => void;
  disabled?: boolean;
}
