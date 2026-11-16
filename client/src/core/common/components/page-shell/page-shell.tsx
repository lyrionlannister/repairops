import type { ReactNode } from "react";

import { PageMeta } from "@common/pages/page-meta";

type PageShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export const PageShell = ({
  title,
  description,
  action,
  children,
}: PageShellProps) => {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <PageMeta title={title} description={description} />

      <div className="flex shrink-0 flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-600 dark:text-brand-400">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        {action}
      </div>

      <div className="custom-scrollbar flex flex-1 min-h-0 flex-col gap-6 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

