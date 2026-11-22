import type { FC } from "react";
import { Inbox } from "lucide-react";
import type { EmptyStateProps } from "../../../props/empty-state-props";

export const EmptyState: FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500 [&>svg]:size-7">
      {icon ?? <Inbox />}
    </div>
    <p className="text-base font-semibold text-gray-700 dark:text-gray-200">{title}</p>
    {description && (
      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
    )}
    {action && <div className="mt-1">{action}</div>}
  </div>
);
