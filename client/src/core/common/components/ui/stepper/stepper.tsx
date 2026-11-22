import type { FC } from "react";
import { Check } from "lucide-react";
import type { StepProps, StepperProps } from "../../../props/stepper-props";

// Oculta (sin desmontar) los pasos que no son el actual.
export const Step: FC<StepProps> = ({ index, current, className = "space-y-6", children }) => (
  <div data-step={index} className={index === current ? className : "hidden"}>
    {children}
  </div>
);
export const Stepper: FC<StepperProps> = ({ steps, current, onStepClick }) => (
  <ol className="flex items-start" aria-label="Pasos del formulario">
    {steps.map((label, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <li key={label} className="flex flex-1 flex-col items-center last:flex-none sm:flex-row sm:items-center sm:last:flex-none">
          <button
            type="button"
            onClick={() => onStepClick(index)}
            disabled={!done}
            aria-current={active ? "step" : undefined}
            className="flex flex-col items-center gap-2 disabled:cursor-default sm:flex-row"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                done
                  ? "bg-brand-500 text-white"
                  : active
                    ? "border-2 border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border border-gray-300 text-gray-400 dark:border-gray-700"
              }`}
            >
              {done ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={`text-xs font-medium sm:text-sm ${
                active ? "text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </span>
          </button>
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className={`mx-3 mt-4 hidden h-px flex-1 sm:mt-0 sm:block ${done ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-800"}`}
            />
          )}
        </li>
      );
    })}
  </ol>
);
