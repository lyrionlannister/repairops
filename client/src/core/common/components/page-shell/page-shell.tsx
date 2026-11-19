import type { ReactNode } from "react";
import { useLocation } from "react-router";

import { PageMeta } from "@common/pages/page-meta";
import { BackButton } from "@ui/back-button/back-button";

type PageShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  // true: la página entera crece y scrollea en la capa del layout (scrollbar al borde, título incluido).
  scrollHeader?: boolean;
  children: ReactNode;
};

export const PageShell = ({
  title,
  description,
  action,
  scrollHeader = false,
  children,
}: PageShellProps) => {
  const { pathname } = useLocation();
  const showBack = pathname !== "/home";

  return (
    <div className={`flex flex-col ${scrollHeader ? "" : "flex-1 min-h-0"}`}>
      <PageMeta title={title} description={description} />

      <div className="flex shrink-0 flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {showBack && <BackButton />}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-600 dark:text-brand-400">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        {action}
      </div>

      <div
        className={`flex flex-1 flex-col gap-6 ${scrollHeader ? "" : "custom-scrollbar min-h-0 overflow-x-hidden overflow-y-auto"}`}
      >
        {children}
      </div>
    </div>
  );
};
