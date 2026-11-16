import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";

import { useCustomers } from "../hooks/use-customers";
import { useCustomersPage } from "../hooks/use-customers-page";
import { CustomersTable } from "../components/customers-table";
import { CustomerDeviceHistoryModal } from "../components/customer-device-history-modal";

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { customers, devices, loading, saving, fetchAll, fetchDevices, remove } = useCustomers();

  const {
    deleteConfirmId,
    setDeleteConfirmId,
    search,
    setSearch,
    filteredCustomers,
    historyCustomer,
    handleDelete,
    openHistory,
    closeHistory,
  } = useCustomersPage({ customers, fetchAll, fetchDevices, remove });

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredCustomers);

  return (
    <PageShell
      title="Clientes"
      description="Gestiona el catálogo de clientes y su historial de equipos."
      action={
        <Button variant="primary" onClick={() => navigate("/app/customers/new")}>
          <Plus className="mr-1.5 size-4" />
          Nuevo cliente
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
            placeholder="Buscar cliente"
            className="pl-9"
          />
        </div>
      </div>

      <CustomersTable
        loading={loading}
        pageItems={pageItems}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onOpenHistory={openHistory}
        onRequestDelete={setDeleteConfirmId}
      />

      <CustomerDeviceHistoryModal historyCustomer={historyCustomer} devices={devices} onClose={closeHistory} />

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
