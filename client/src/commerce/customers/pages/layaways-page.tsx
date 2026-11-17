import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, PackageCheck, Ban } from "lucide-react";
import { useLayaways, type LayawayMethod, type LayawayRecord } from "../hooks/use-layaways";
import { useCustomers } from "../hooks/use-customers";
import { useBranch } from "@common/hooks/use-branch";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { Alert } from "@ui/alert/alert";
import { Modal } from "@ui/modal/modal";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { METHOD_LABELS, STATUS_LABELS, formatMoney, daysUntil } from "../utils/format";

export const LayawaysPage: React.FC = () => {
  const navigate = useNavigate();
  const { layaways, saving, fetchAll, complete, cancel } = useLayaways();
  const { customers, fetchAll: fetchCustomers } = useCustomers();
  const { workingBranchId } = useBranch();
  const { session: cashSession, fetchOpenSession } = useCash();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeAmount, setCompleteAmount] = useState("");
  const [completeMethod, setCompleteMethod] = useState<LayawayMethod>("efectivo");
  const [noCashError, setNoCashError] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(layaways);

  useEffect(() => {
    fetchAll();
    fetchCustomers();
  }, [fetchAll, fetchCustomers]);

  useEffect(() => {
    if (workingBranchId) fetchOpenSession(workingBranchId);
  }, [workingBranchId, fetchOpenSession]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? `Cliente ${id}`;

  const openCompleteModal = (layaway: LayawayRecord) => {
    setCompletingId(layaway.id);
    setCompleteAmount((layaway.totalValue - layaway.depositAmount).toFixed(2));
    setCompleteMethod("efectivo");
  };

  const handleComplete = async () => {
    if (!completingId) return;
    if (!cashSession) {
      setCompletingId(null);
      setNoCashError(true);
      return;
    }
    setNoCashError(false);
    await complete(completingId, cashSession.id, [{ method: completeMethod, amount: Number(completeAmount) || 0 }]);
    setCompletingId(null);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancel(cancelId);
    setCancelId(null);
  };

  return (
    <PageShell
      title="Apartados"
      description="Reserva productos para un cliente con un anticipo. El stock físico solo baja al completar."
      action={
        <Button variant="primary" startIcon={<Plus className="size-4" />} onClick={() => navigate("/commerce/layaways/new")}>
          Nuevo apartado
        </Button>
      }
    >
      {noCashError && <Alert variant="warning" title="Sin sesión de caja" message="Abre una sesión de caja en Caja antes de completar un apartado." />}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        {layaways.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay apartados registrados.</div>
        ) : (
          <ScrollTable
            className="min-w-160"
            colgroup={
              <colgroup>
                <col />
                <col className="w-32" />
                <col className="w-36" />
                <col className="w-28" />
                <col className="w-28" />
              </colgroup>
            }
            header={
              <tr>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Cliente</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Vence</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            }
          >
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageItems.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-4 text-gray-800 dark:text-gray-200">{customerName(l.customerId)}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{formatMoney(l.totalValue)}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                    {l.expiresAt} {l.status === "open" && `(${daysUntil(l.expiresAt)}d)`}
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{STATUS_LABELS[l.status]}</td>
                  <td className="px-5 py-4 text-right">
                    {l.status === "open" && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openCompleteModal(l)} className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Completar">
                          <PackageCheck className="size-4" />
                        </button>
                        <button onClick={() => setCancelId(l.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Cancelar">
                          <Ban className="size-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
        )}

        {totalItems > 0 && (
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

      <Modal isOpen={Boolean(completingId)} onClose={() => setCompletingId(null)} className="max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Completar apartado</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Registra el pago del saldo restante.</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-gray-500">Monto</Label>
            <Input type="number" value={completeAmount} onChange={(e) => setCompleteAmount(e.target.value)} />
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
          <Button type="button" variant="outline" onClick={() => setCompletingId(null)} disabled={saving}>
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

