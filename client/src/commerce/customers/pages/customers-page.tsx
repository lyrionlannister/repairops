import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Select } from "@ui/select/select";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { usePermissions } from "@common/hooks/use-permissions";

import { useCustomers } from "../hooks/use-customers";
import { useCustomersPage } from "../hooks/use-customers-page";
import { CustomersTable } from "../components/customers-table";
import { CREDIT_FILTER_OPTIONS, parseCreditFilter } from "../utils/overdue";

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { customers, loading, saving, fetchAll, remove } = useCustomers();

  const {
    deleteConfirmId,
    setDeleteConfirmId,
    search,
    setSearch,
    creditFilter,
    setCreditFilter,
    filteredCustomers,
    handleDelete,
  } = useCustomersPage({ customers, fetchAll, remove });

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredCustomers);

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
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar cliente"
            className="pl-9"
          />
        </div>
        <Select
          value={creditFilter}
          onChange={(value) => {
            setCreditFilter(parseCreditFilter(value));
            setPage(1);
          }}
          options={CREDIT_FILTER_OPTIONS}
          className="w-full sm:w-60"
        />
        </div>
      </div>

      <CustomersTable
        canEdit={can("customers.write")}
        canDelete={can("customers.delete")}
        loading={loading}
        pageItems={pageItems}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
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
