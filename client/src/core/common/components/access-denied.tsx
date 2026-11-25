import type { FC } from "react";
import { Link } from "react-router";
import { Lock } from "lucide-react";
import { PageMeta } from "../pages/page-meta";

export const AccessDenied: FC = () => (
  <>
    <PageMeta title="Sin acceso" description="No tienes acceso a esta sección" />
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
        <Lock className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          No tienes acceso a esta sección
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Si la necesitas, pide al dueño del taller que te dé el permiso.
        </p>
      </div>
      <Link to="/" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
        Ir al inicio
      </Link>
    </div>
  </>
);
