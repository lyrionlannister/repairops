import { Plus, Pencil, Search, Trash2, Smartphone, Users } from "lucide-react";
import { useNavigate } from "react-router";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Modal from "@ui/modal/modal";
import ConfirmModal from "@ui/modal/confirm-modal";
import Pagination from "@ui/table/pagination";
import ScrollTable from "@ui/table/scroll-table";
import PageShell from "@common/components/page-shell/page-shell";
import usePaginatedList from "@common/hooks/use-paginated-list";

import { useCustomers } from "../hooks/use-customers";
import { useCustomersPage } from "../hooks/use-customers-page";

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const CustomersPage = () => {
  const navigate = useNavigate();
  const { customers, devices, loading, saving, error, fetchAll, fetchDevices, remove } = useCustomers();

  const {
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
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
        <Button variant="primary" onClick={() => navigate("/admin/customers/new")}>
          <Plus className="mr-1.5 size-4" />
          Nuevo cliente
        </Button>
      }
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}

      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Buscar cliente"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando clientes...</div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
            <Users className="size-10 opacity-40" />
            <p className="text-sm">No hay clientes registrados todavía.</p>
          </div>
        ) : (
          <ScrollTable
            colgroup={
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col className="w-36" />
              </colgroup>
            }
            header={
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Teléfono</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Límite crédito</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            }
          >
            <tbody>
              {pageItems.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{customer.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.phone}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.email || "—"}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {customer.creditLimit > 0 ? `$${customer.creditLimit.toLocaleString("es-MX")}` : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openHistory(customer)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                        title="Historial de equipos"
                      >
                        <Smartphone className="size-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(customer.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        title="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
        )}

        {!loading && totalItems > 0 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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

      <Modal isOpen={Boolean(historyCustomer)} onClose={closeHistory} className="max-w-lg p-6 sm:p-8 mx-4">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          Historial de equipos
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{historyCustomer?.name}</p>

        {devices.length === 0 ? (
          <p className="text-sm text-gray-400">Este cliente todavía no tiene notas de reparación registradas.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {devices.map((device) => (
              <li key={`${device.brand}-${device.model}`} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {device.brand} {device.model}
                  </p>
                  <p className="text-xs text-gray-400">
                    {device.notesCount} {device.notesCount === 1 ? "nota" : "notas"} · última: {formatDate(device.lastReceivedAt)} (#{device.controlNumber})
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end pt-4">
          <Button type="button" variant="outline" onClick={closeHistory}>
            Cerrar
          </Button>
        </div>
      </Modal>

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

export default CustomersPage;
