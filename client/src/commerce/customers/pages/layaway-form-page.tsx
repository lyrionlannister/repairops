import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useLayaways, type LayawayMethod } from "../hooks/use-layaways";
import { useCustomers } from "../hooks/use-customers";
import { useCustomerContext } from "../hooks/use-customer-context";
import CustomerContextPanel from "../components/customer-context-panel";
import { useInventory } from "@commerce/inventory/hooks/use-inventory";
import { useCash } from "@commerce/cash/hooks/use-cash";
import useBranch from "@common/hooks/use-branch";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import DatePicker from "@ui/date-picker/date-picker";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import Alert from "@ui/alert/alert";
import PageShell from "@common/components/page-shell/page-shell";

const FORM_CARD_CLASS = "space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3";

const METHOD_LABELS: Record<LayawayMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

type LineDraft = { inventoryItemId: string; quantity: string; unitPrice: string };

const formatMoney = (v: number) => `$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const LayawayFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { saving, error, open } = useLayaways();
  const { customers, fetchAll: fetchCustomers } = useCustomers();
  const { items: allInventoryItems, fetchAll: fetchInventory } = useInventory();
  const { activeBranchId } = useBranch();
  // Solo items de la sucursal activa -- un apartado reserva stock fisico,
  // no tiene sentido reservar de una sucursal que el cajero no ve.
  const inventoryItems = useMemo(
    () => (activeBranchId ? allInventoryItems.filter((item) => item.localId === activeBranchId) : allInventoryItems),
    [allInventoryItems, activeBranchId],
  );
  const { session: cashSession, loading: loadingCashSession, fetchOpenSession } = useCash();

  const [customerId, setCustomerId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<LayawayMethod>("efectivo");
  const [lines, setLines] = useState<LineDraft[]>([{ inventoryItemId: "", quantity: "1", unitPrice: "" }]);

  useEffect(() => {
    fetchCustomers();
    fetchInventory();
  }, [fetchCustomers, fetchInventory]);

  useEffect(() => {
    if (activeBranchId) fetchOpenSession(activeBranchId);
  }, [activeBranchId, fetchOpenSession]);

  const { creditLimit, creditBalance, creditAvailable, creditLoaded, devices, activeLayaways } = useCustomerContext(
    customerId || null,
  );

  const updateLine = (index: number, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { inventoryItemId: "", quantity: "1", unitPrice: "" }]);

  const totalValue = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashSession || !customerId || !expiresAt) return;
    const validLines = lines.filter((l) => l.inventoryItemId && Number(l.quantity) > 0);
    if (validLines.length === 0) return;

    const created = await open({
      customerId,
      cashSessionId: cashSession.id,
      depositAmount: Number(depositAmount) || 0,
      depositMethod,
      expiresAt,
      items: validLines.map((l) => ({
        inventoryItemId: l.inventoryItemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });

    if (created) navigate("/admin/layaways");
  };

  const hasContext = Boolean(customerId);
  const wrapperClass = hasContext ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : undefined;
  const formClass = hasContext ? `${FORM_CARD_CLASS} lg:col-span-2` : FORM_CARD_CLASS;

  const form = (
    <form onSubmit={handleSubmit} className={formClass}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-gray-500">Cliente</Label>
          <Select
            value={customerId}
            onChange={setCustomerId}
            placeholder="Selecciona un cliente"
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div>
          <Label className="text-gray-500">Vence el</Label>
          <DatePicker value={expiresAt} onChange={setExpiresAt} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-gray-500">Items</Label>
        {lines.map((line, index) => (
          <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select
                value={line.inventoryItemId}
                onChange={(value) => {
                  const item = inventoryItems.find((i) => i.id === value);
                  updateLine(index, { inventoryItemId: value, unitPrice: item ? String(item.salePrice) : "" });
                }}
                placeholder="Selecciona un item"
                options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (disponible: ${i.available})` }))}
              />
            </div>
            <div className="w-full sm:w-24">
              <Input type="number" placeholder="Cant." value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} />
            </div>
            <div className="w-full sm:w-32">
              <Input type="number" placeholder="Precio" value={line.unitPrice} onChange={(e) => updateLine(index, { unitPrice: e.target.value })} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addLine}>
          <Plus className="mr-1.5 size-4" />
          Agregar item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-gray-500">Anticipo</Label>
          <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
        </div>
        <div>
          <Label className="text-gray-500">Método del anticipo</Label>
          <Select
            value={depositMethod}
            onChange={(value) => setDepositMethod(value as LayawayMethod)}
            options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400">Valor total</span>
        <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(totalValue)}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/admin/layaways")} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving || !cashSession}>
          {saving ? "Guardando..." : "Abrir apartado"}
        </Button>
      </div>
    </form>
  );

  return (
    <PageShell title="Nuevo apartado" description="Reserva productos para un cliente con un anticipo. El stock físico solo baja al completar.">
      {error && <Alert variant="error" title="Error" message={error} />}
      {!loadingCashSession && !cashSession && (
        <Alert variant="warning" title="Sin sesión de caja" message="Abre una sesión de caja en Caja antes de apartar." />
      )}

      {hasContext ? (
        <div className={wrapperClass}>
          {form}
          <CustomerContextPanel
            creditLimit={creditLimit}
            creditBalance={creditBalance}
            creditAvailable={creditAvailable}
            creditLoaded={creditLoaded}
            devices={devices}
            activeLayaways={activeLayaways}
          />
        </div>
      ) : (
        form
      )}
    </PageShell>
  );
};

export default LayawayFormPage;
