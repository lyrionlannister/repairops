export interface CheckboxFieldProps {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}
