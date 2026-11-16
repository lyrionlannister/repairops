import { Avatar } from "@common/components/ui/avatar/Avatar";
import type { Me } from "../hooks/use-me";
import { ROLE_LABELS, PAY_CYCLE_LABELS } from "@identity/users/hooks/use-users";

interface ProfileCardProps {
  me: Me;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ me }) => (
  <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3 sm:flex-row sm:items-start">
    <Avatar name={`${me.firstName} ${me.lastName}`} size="xxlarge" />
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {me.firstName} {me.lastName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{me.email}</p>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-gray-400">Rol</dt>
          <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">{ROLE_LABELS[me.role]}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-gray-400">Estado</dt>
          <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">{me.isActive ? "Activo" : "Inactivo"}</dd>
        </div>
        {me.payCycle && (
          <div>
            <dt className="text-xs font-semibold uppercase text-gray-400">Ciclo de pago</dt>
            <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">{PAY_CYCLE_LABELS[me.payCycle]}</dd>
          </div>
        )}
      </dl>
    </div>
  </div>
);
