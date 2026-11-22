import { useEffect } from "react";
import { useNavigate } from "react-router";
import { UserPlus, Pencil, Search } from "lucide-react";
import { useUsers } from "../hooks/use-users";
import { formatRoles } from "../utils/roles";
import { usePlan } from "../../../app_platform/billing/hooks/use-plan";
import { PlanUsageCard } from "../../../app_platform/billing/components/plan-usage-card";
import { useUsersPage } from "../hooks/use-users-page";
import { Toggle } from "@ui/toggle/toggle";
import { Input } from "@ui/inputs/input";
import { Button } from "@ui/button/button";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { PageShell } from "@common/components/page-shell/page-shell";
import { formatDate } from "../utils/format";

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading, error, fetchUsers, toggleUserStatus, togglingId, toggleError } = useUsers();
  const { summary: planSummary, fetchPlan } = usePlan();
  const { search, setSearch, filteredUsers } = useUsersPage(users);

  useEffect(() => {
    fetchUsers();
    fetchPlan();
  }, [fetchUsers, fetchPlan]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredUsers);

  return (
    <PageShell
      title="Usuarios"
      description="Gestiona los usuarios del sistema."
      action={
        <Button
          variant="primary"
          startIcon={<UserPlus className="size-4" />}
          onClick={() => navigate("/identity/users/new")}
        >
          Nuevo usuario
        </Button>
      }
    >
      {planSummary && <PlanUsageCard summary={planSummary} />}
      {toggleError && <p className="text-sm text-error-500">{toggleError}</p>}

      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Buscar usuario"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="secondary" onClick={fetchUsers}>Reintentar</Button>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No hay usuarios registrados.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crea el primer usuario para comenzar.</p>
            <Button variant="primary" startIcon={<UserPlus className="size-4" />} onClick={() => navigate("/identity/users/new")}>
              Nuevo usuario
            </Button>
          </div>
        ) : (
          <ScrollTable
            className="min-w-200"
            colgroup={
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
                <col className="w-28" />
              </colgroup>
            }
            header={
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Rol</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Creado</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            }
          >
            <tbody>
              {pageItems.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatRoles(user.roles)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <Toggle
                      checked={user.isActive}
                      onChange={() => toggleUserStatus(user.id).then(fetchPlan)}
                      disabled={togglingId === user.id}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => navigate(`/identity/users/${user.id}/edit`)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
        )}

        {!loading && !error && totalItems > 0 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-11 rounded-lg md:h-9 border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>
                Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} de {totalItems}
              </span>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </PageShell>
  );
};

