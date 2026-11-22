import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Pencil, Search, Store } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Toggle } from "@ui/toggle/toggle";
import { DataTable } from "@ui/table/data-table";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { useBranch } from "@common/hooks/use-branch";

import { useBranches } from "../hooks/use-branches";
import { useBranchesPage } from "../hooks/use-branches-page";
import type { Branch } from "../types/branches";

export const BranchesPage = () => {
  const navigate = useNavigate();
  const { branches, loading, fetchAll, setActive } = useBranches();
  const { refreshBranches } = useBranch();
  const { search, setSearch, filteredBranches } = useBranchesPage(branches);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredBranches);

  const handleToggleActive = async (branch: Branch) => {
    const ok = await setActive(branch.id, !branch.isActive);
    if (ok) {
      await refreshBranches();
    }
  };

  return (
    <PageShell
      title="Sucursales"
      description="Administra las sucursales disponibles y cuál está activa en el selector de arriba."
      action={
        <Button variant="primary" onClick={() => navigate("/identity/branches/new")}>
          <Plus className="mr-1.5 size-4" />
          Nueva sucursal
        </Button>
      }
    >
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar sucursal"
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        loading={loading}
        loadingText="Cargando sucursales..."
        isEmpty={pageItems.length === 0}
        empty={{
          icon: <Store />,
          title:
            branches.length === 0
              ? "No hay sucursales registradas."
              : "Sin resultados para la búsqueda.",
          description:
            branches.length === 0
              ? "Crea la primera sucursal para comenzar."
              : "Prueba con otro término.",
          action: (
            <Button
              variant="primary"
              startIcon={<Plus className="size-4" />}
              onClick={() => navigate("/identity/branches/new")}
            >
              Nueva sucursal
            </Button>
          ),
        }}
        pagination={{
          page,
          pageSize,
          totalPages,
          totalItems,
          startIndex,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        className="min-w-160"
        colgroup={
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col className="w-24" />
          </colgroup>
        }
        header={
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Nombre
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Dirección
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Teléfono
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Activa
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Editar
            </th>
          </tr>
        }
      >
        <tbody>
          {pageItems.map((branch) => (
            <tr
              key={branch.id}
              className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
            >
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {branch.name}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                {branch.address || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                {branch.phone || "—"}
              </td>
              <td className="px-4 py-4">
                <Toggle checked={branch.isActive} onChange={() => handleToggleActive(branch)} />
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => navigate(`/identity/branches/${branch.id}/edit`)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </PageShell>
  );
};
