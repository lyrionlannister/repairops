import { useNavigate } from "react-router";
import { Plus, PackageCheck, Ban, Search } from "lucide-react";
import { useLayawaysPage } from "../hooks/use-layaways-page";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { Alert } from "@ui/alert/alert";
import { Modal } from "@ui/modal/modal";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { DataTable } from "@ui/table/data-table";
import { PageShell } from "@common/components/page-shell/page-shell";
import {
  METHOD_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  daysUntil,
  expiryHint,
  formatDate,
  formatMoney,
  LAYAWAY_STATUS_FILTER_OPTIONS,
} from "../utils/format";
import { Badge } from "@ui/badge/badge";
import type { LayawayMethod, LayawayStatusFilter } from "../types/layaways";
export const LayawaysPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    list,
    saving,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    hasFilters,
    completingId,
    setCompletingId,
    completeAmount,
    setCompleteAmount,
    completeMethod,
    setCompleteMethod,
    noCashError,
    cancelId,
    setCancelId,
    openCompleteModal,
    handleComplete,
    handleCancel,
  } = useLayawaysPage();

  return (
    <PageShell
      title="Apartados"
      description="Reserva productos para un cliente con un anticipo. El stock físico solo baja al completar."
      action={
        <Button
          variant="primary"
          startIcon={<Plus className="size-4" />}
          onClick={() => navigate("/commerce/layaways/new")}
        >
          Nuevo apartado
        </Button>
      }
    >
      {noCashError && (
        <Alert
          variant="warning"
          title="Sin sesión de caja"
          message="Abre una sesión de caja en Caja antes de completar un apartado."
        />
      )}
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as LayawayStatusFilter)}
            options={LAYAWAY_STATUS_FILTER_OPTIONS}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      <DataTable
        loading={list.loading}
        loadingText="Cargando apartados..."
        error={list.items.length === 0 ? list.error : null}
        onRetry={() => void list.refetch()}
        isEmpty={list.items.length === 0}
        empty={{
          icon: <PackageCheck />,
          title: hasFilters ? "Sin resultados para la búsqueda." : "No hay apartados registrados.",
          description: hasFilters
            ? "Prueba con otro cliente o estado."
            : "Crea un apartado para reservar productos con anticipo.",
          action: !hasFilters && (
            <Button
              variant="primary"
              startIcon={<Plus className="size-4" />}
              onClick={() => navigate("/commerce/layaways/new")}
            >
              Nuevo apartado
            </Button>
          ),
        }}
        pagination={{
          page: list.page,
          pageSize: list.pageSize,
          totalPages: list.totalPages,
          totalItems: list.total,
          startIndex: list.startIndex,
          onPageChange: list.setPage,
          onPageSizeChange: list.setPageSize,
        }}
        className="min-w-160"
        colgroup={
          <colgroup>
            <col className="w-48" />
            <col className="w-32" />
            <col className="w-36" />
            <col className="w-28" />
            <col className="w-28" />
          </colgroup>
        }
        header={
          <tr>
            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Cliente
            </th>
            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Total
            </th>
            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Vence
            </th>
            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Estado
            </th>
            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Acciones
            </th>
          </tr>
        }
      >
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {list.items.map((l) => (
            <tr key={l.id}>
              <td className="px-5 py-4 text-gray-800 dark:text-gray-200">
                {l.customerName ?? "Cliente sin nombre"}
              </td>
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                {formatMoney(l.totalValue)}
              </td>
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                {formatDate(l.expiresAt)}
                {l.status === "open" && (
                  <span className="ml-1 text-xs text-gray-400">({expiryHint(daysUntil(l.expiresAt))})</span>
                )}
              </td>
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                <Badge size="sm" color={STATUS_COLORS[l.status]}>
                  {STATUS_LABELS[l.status]}
                </Badge>
              </td>
              <td className="px-5 py-4 text-right">
                {l.status === "open" && (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openCompleteModal(l)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                      title="Completar"
                      aria-label="Completar"
                    >
                      <PackageCheck className="size-4" />
                    </button>
                    <button
                      onClick={() => setCancelId(l.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <Ban className="size-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <Modal
        isOpen={Boolean(completingId)}
        onClose={() => setCompletingId(null)}
        className="max-w-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Completar apartado
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Registra el pago del saldo restante.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-gray-500">Monto</Label>
            <Input
              type="number"
              value={completeAmount}
              onChange={(e) => setCompleteAmount(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-gray-500">Método</Label>
            <Select
              value={completeMethod}
              onChange={(value) => setCompleteMethod(value as LayawayMethod)}
              options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCompletingId(null)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleComplete} disabled={saving}>
            {saving ? "Procesando..." : "Completar"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(cancelId)}
        title="Cancelar apartado"
        message="El anticipo ya cobrado no se reembolsa automáticamente. ¿Confirmas cancelar?"
        danger
        loading={saving}
        onConfirm={handleCancel}
        onClose={() => setCancelId(null)}
      />
    </PageShell>
  );
};
