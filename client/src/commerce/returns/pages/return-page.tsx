import { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { useReturns, type SaleWithItems, type SaleListItem, type RefundMethod } from "../hooks/use-returns";
import { useCash } from "@commerce/cash/hooks/use-cash";
import useBranch from "@common/hooks/use-branch";
import CustomerSelect from "@common/components/customer-select";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import Alert from "@ui/alert/alert";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@ui/table/table";
import PageShell from "@common/components/page-shell/page-shell";

const PAYMENT_LABELS: Record<RefundMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

type LineDraft = { saleItemId: string; quantity: string; refundAmount: string };

const formatMoney = (v: number) => `$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const round2 = (v: number) => Math.round(v * 100) / 100;

const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const ReturnPage: React.FC = () => {
  const { searching, searchError, saving, error, findSaleByNumber, findSaleById, listSalesByCustomer, getReturnedQuantities, create } =
    useReturns();
  const { activeBranchId } = useBranch();
  const { session: cashSession, loading: loadingCashSession, fetchOpenSession } = useCash();

  const [saleNumberInput, setSaleNumberInput] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSales, setCustomerSales] = useState<SaleListItem[]>([]);
  const [customerSaleId, setCustomerSaleId] = useState("");
  const [sale, setSale] = useState<SaleWithItems | null>(null);
  const [alreadyReturned, setAlreadyReturned] = useState<Record<string, number>>({});
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("efectivo");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Protege contra doble clic en "Confirmar devolución", mismo mecanismo que
  // venta rápida -- ReturnService.create devuelve la misma devolución en vez
  // de crear una segunda.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  useEffect(() => {
    if (activeBranchId) fetchOpenSession(activeBranchId);
  }, [activeBranchId, fetchOpenSession]);

  useEffect(() => {
    setCustomerSaleId("");
    if (!customerId) {
      setCustomerSales([]);
      return;
    }
    listSalesByCustomer(customerId).then(setCustomerSales);
  }, [customerId, listSalesByCustomer]);

  // Calcula alreadyReturned y lines ANTES de setSale -- si setSale corriera
  // primero, el render que sigue a ese await usaria "lines" todavia viejas
  // (de la venta anterior) contra los items de la venta nueva, y
  // lines.find(...)! regresaria undefined.
  const applySale = async (found: SaleWithItems | null) => {
    if (!found) {
      setSale(null);
      setLines([]);
      return;
    }
    const returned = await getReturnedQuantities(found.id);
    setAlreadyReturned(returned);
    setLines(found.items.map((item) => ({ saleItemId: item.id, quantity: "0", refundAmount: "0.00" })));
    setSale(found);
  };

  const handleSearch = async () => {
    const saleNumber = Number(saleNumberInput);
    if (!saleNumber) return;
    await applySale(await findSaleByNumber(saleNumber));
  };

  const handleSelectCustomerSale = async (saleId: string) => {
    setCustomerSaleId(saleId);
    if (!saleId) {
      await applySale(null);
      return;
    }
    await applySale(await findSaleById(saleId));
  };

  const updateLine = (saleItemId: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.saleItemId === saleItemId ? { ...l, ...patch } : l)));
  };

  const activeLines = lines.filter((l) => Number(l.quantity) > 0);
  const totalRefunded = round2(activeLines.reduce((sum, l) => sum + (Number(l.refundAmount) || 0), 0));

  const resetForm = () => {
    setSaleNumberInput("");
    setCustomerId("");
    setCustomerSales([]);
    setCustomerSaleId("");
    setSale(null);
    setLines([]);
    setReason("");
    setIdempotencyKey(newIdempotencyKey());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale || !cashSession || activeLines.length === 0 || !reason) return;

    const theReturn = await create({
      saleId: sale.id,
      cashSessionId: cashSession.id,
      refundMethod,
      reason,
      totalRefunded,
      idempotencyKey,
      items: activeLines.map((l) => ({
        saleItemId: l.saleItemId,
        quantity: Number(l.quantity),
        refundAmount: Number(l.refundAmount),
      })),
    });

    if (theReturn) {
      setSuccessMsg(`Devolución #${theReturn.returnNumber} registrada por ${formatMoney(theReturn.totalRefunded)}.`);
      resetForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <PageShell
      title="Devoluciones"
      description="Busca una venta por su folio para devolver una o más líneas. Nunca modifica la venta original."
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}
      {!loadingCashSession && !cashSession && (
        <Alert
          variant="warning"
          title="Sin sesión de caja"
          message="No hay una sesión de caja abierta para este local. Ábrela en Caja antes de devolver."
        />
      )}

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-40">
            <Label className="text-gray-500">Folio de venta</Label>
            <Input
              type="number"
              placeholder="# venta"
              value={saleNumberInput}
              onChange={(e) => setSaleNumberInput(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
            <Search className="mr-1.5 size-4" />
            {searching ? "Buscando..." : "Buscar"}
          </Button>
          <div className="hidden h-11 items-center text-sm text-gray-400 sm:flex">o</div>
          <div className="w-full sm:flex-1">
            <Label className="text-gray-500">Buscar por cliente</Label>
            <CustomerSelect value={customerId} onChange={(id) => setCustomerId(id)} />
          </div>
        </div>

        {customerId && (
          <div className="custom-scrollbar max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            {customerSales.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Este cliente no tiene ventas registradas.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-800">
                    {["Folio", "Fecha", "Total", ""].map((h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSales.map((s) => (
                    <TableRow
                      key={s.id}
                      className={`cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2 ${
                        customerSaleId === s.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                      }`}
                      onClick={() => handleSelectCustomerSale(s.id)}
                    >
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        #{s.saleNumber}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatMoney(s.totalValue)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm text-brand-600 dark:text-brand-400">
                        {customerSaleId === s.id ? "Seleccionada" : "Usar"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {searchError && <Alert variant="error" title="No encontrada" message={searchError} />}

      {sale && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">Venta #{sale.saleNumber}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total: {formatMoney(sale.totalValue)}</span>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-500">Líneas a devolver</Label>
            {sale.items.map((item) => {
              const returned = alreadyReturned[item.id] ?? 0;
              const remaining = item.quantity - returned;
              const line = lines.find((l) => l.saleItemId === item.id)!;
              return (
                <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                    {item.lineType === "inventory_item" ? "Producto" : "Servicio"} · cant. {item.quantity} ·{" "}
                    {formatMoney(item.unitPrice)} c/u
                    {returned > 0 && <span className="text-amber-500"> · ya devuelto: {returned}</span>}
                  </div>
                  <div className="w-full sm:w-24">
                    <Input
                      type="number"
                      placeholder="Cant."
                      value={line.quantity}
                      max={String(remaining)}
                      onChange={(e) => updateLine(item.id, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Input
                      type="number"
                      placeholder="Reembolso"
                      value={line.refundAmount}
                      onChange={(e) => updateLine(item.id, { refundAmount: e.target.value })}
                    />
                  </div>
                  {remaining <= 0 && <span className="text-xs text-red-500">Sin disponible</span>}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-gray-500">Método de reembolso</Label>
              <Select
                value={refundMethod}
                onChange={(value) => setRefundMethod(value as RefundMethod)}
                options={Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div>
              <Label className="text-gray-500">Motivo</Label>
              <Input placeholder="Motivo de la devolución" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total a reembolsar</span>
            <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(totalRefunded)}</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={saving || !cashSession || activeLines.length === 0 || !reason}
          >
            <RotateCcw className="mr-1.5 size-4" />
            {saving ? "Procesando..." : "Confirmar devolución"}
          </Button>
        </form>
      )}
    </PageShell>
  );
};

export default ReturnPage;
