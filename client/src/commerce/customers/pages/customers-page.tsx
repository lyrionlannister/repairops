import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Select } from "@ui/select/select";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePermissions } from "@common/hooks/use-permissions";

import { useCustomers } from "../hooks/use-customers";
import { useCustomersPage } from "../hooks/use-customers-page";
import { CustomersTable } from "../components/customers-table";
import { CREDIT_FILTER_OPTIONS, parseCreditFilter } from "../utils/overdue";

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { saving, remove } = useCustomers();
  const {
    deleteConfirmId,
    setDeleteConfirmId,
    search,
    setSearch,
    creditFilter,
    setCreditFilter,
    list,
    hasFilters,
    handleDelete,
  } = useCustomersPage({ remove });

  return (
    <PageShell
      title="Clientes"
      description="Gestiona el catálogo de clientes y su historial de equipos."
      action={
        can("customers.write") && (
          <Button variant="primary" onClick={() => navigate("/commerce/customers/new")}>
            <Plus className="mr-1.5 size-4" />
            Nuevo cliente
          </Button>
        )
      }
    >
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, teléfono o correo"
              className="pl-9"
            />
          </div>
          <Select
            value={creditFilter}
            onChange={(value) => setCreditFilter(parseCreditFilter(value))}
            options={CREDIT_FILTER_OPTIONS}
            className="w-full sm:w-60"
          />
        </div>
      </div>

      <CustomersTable
        error={list.items.length === 0 ? list.error : null}
        onRetry={() => void list.refetch()}
        canEdit={can("customers.write")}
        canDelete={can("customers.delete")}
        loading={list.loading}
        hasFilters={hasFilters}
        pageItems={list.items}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        totalItems={list.total}
        startIndex={list.startIndex}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        onRequestDelete={setDeleteConfirmId}
      />

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Eliminar cliente"
        message="¿Eliminar este cliente? Esta acción no se puede deshacer."
        danger
        loading={saving}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};
