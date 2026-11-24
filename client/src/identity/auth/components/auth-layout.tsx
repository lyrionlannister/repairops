import { Smartphone } from "lucide-react";
import { ThemeToggler } from "../../../core/common/components/menu/theme-toggler";
import type { AuthLayoutProps } from "../props/auth-layout-props";

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative z-1 flex flex-col justify-center w-full h-dvh p-6 bg-white dark:bg-gray-900 lg:flex-row sm:p-0">
      {children}
      <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
        <div className="relative flex items-center justify-center z-1">
          <div className="flex flex-col items-center max-w-xs gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Smartphone className="size-7" />
            </span>
            <p className="text-center text-xl font-bold text-white">RepairOps</p>
          </div>
        </div>
      </div>
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeToggler />
      </div>
    </div>
  );
};
