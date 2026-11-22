import type { FC } from "react";
import type { UserFormSectionProps } from "../props/user-form-section-props";

export const UserFormSection: FC<UserFormSectionProps> = ({
  step,
  title,
  description,
  children,
}) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
    <header className="mb-5 flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </header>
    {children}
  </section>
);
