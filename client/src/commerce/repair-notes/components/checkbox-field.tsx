interface CheckboxFieldProps {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ checked, label, onChange, disabled }) => (
  <label className="flex cursor-pointer items-center gap-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="size-4 rounded border-gray-300 accent-brand-600"
    />
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
  </label>
);
