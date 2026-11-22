import { useEffect, useId, useRef } from "react";
import type { FC } from "react";
import type { Instance } from "flatpickr/dist/types/instance";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import "flatpickr/dist/flatpickr.css";
import { Calendar } from "lucide-react";
import type { DatePickerProps } from "../../../props/date-picker-props";

export const DatePicker: FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  required = false,
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const instanceRef = useRef<Instance | null>(null);

  useEffect(() => {
    const instance = flatpickr(`#${CSS.escape(inputId)}`, {
      mode: "single",
      static: true,
      allowInput: true,
      locale: Spanish,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value || undefined,
      onChange: ([date]) => {
        if (date) onChange?.(flatpickr.formatDate(date, "Y-m-d"));
      },
    });

    instanceRef.current = Array.isArray(instance) ? null : instance;

    return () => {
      instanceRef.current = null;
      if (!Array.isArray(instance)) instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputId]);

  useEffect(() => {
    instanceRef.current?.setDate(value || "", false);
  }, [value]);

  return (
    <div className="relative">
      <input
        id={inputId}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-theme-xs transition-colors duration-200 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 ${className}`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <Calendar className="size-4" />
      </span>
    </div>
  );
};

