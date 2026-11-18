import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useLayaways, type LayawayMethod } from "../hooks/use-layaways";
import { useCustomers } from "../hooks/use-customers";
import { useCustomerContext } from "../hooks/use-customer-context";
import { useLayawayItemLines } from "../hooks/use-layaway-item-lines";
import { CustomerContextPanel } from "../components/customer-context-panel";
import { useBranchScopedInventory } from "@commerce/inventory/hooks/use-branch-scoped-inventory";
import { useCash } from "@commerce/cash/hooks/use-cash";
import { useBranch } from "@common/hooks/use-branch";
import { Alert } from "@ui/alert/alert";
import { PageShell } from "@common/components/page-shell/page-shell";
import { LayawayForm } from "../components/layaway-form";

export const LayawayFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { saving, error, open } = useLayaways();
  const { customers, fetchAll: fetchCustomers } = useCustomers();
  const { workingBranchId } = useBranch();
  // Solo items de la sucursal activa -- un apartado reserva stock fisico,
  // no tiene sentido reservar de una sucursal que el cajero no ve.
  const { items: inventoryItems, fetchAll: fetchInventory } =
    useBranchScopedInventory(workingBranchId);
  const { session: cashSession, loading: loadingCashSession, fetchOpenSession } = useCash();

  const [formError, setFormError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<LayawayMethod>("efectivo");
  const { lines, updateLine, handleItemChange, addLine, totalValue, buildItemsPayload } =
    useLayawayItemLines(inventoryItems);

  useEffect(() => {
    fetchCustomers();
    fetchInventory();
  }, [fetchCustomers, fetchInventory]);

  useEffect(() => {
    if (workingBranchId) fetchOpenSession(workingBranchId);
  }, [workingBranchId, fetchOpenSession]);

  const { creditLimit, creditBalance, creditAvailable, creditLoaded, devices, activeLayaways } =
    useCustomerContext(customerId || null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!cashSession) return setFormError("Abre una sesión de caja antes de apartar.");
    if (!customerId) return setFormError("Selecciona un cliente.");
    if (!expiresAt) return setFormError("Indica la fecha de vencimiento.");
    const items = buildItemsPayload();
    if (items.length === 0) return setFormError("Agrega al menos un producto con precio.");

    const created = await open({
      customerId,
      cashSessionId: cashSession.id,
      depositAmount: Number(depositAmount) || 0,
      depositMethod,
      expiresAt,
      items,
    });

    if (created) navigate("/commerce/layaways");
  };

  const hasContext = Boolean(customerId);
  const wrapperClass = hasContext ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : undefined;

  const form = (
    <LayawayForm
      hasContext={hasContext}
      customers={customers}
      customerId={customerId}
      onCustomerIdChange={setCustomerId}
      expiresAt={expiresAt}
      onExpiresAtChange={setExpiresAt}
      inventoryItems={inventoryItems}
      lines={lines}
      onUpdateLine={updateLine}
      onItemChange={handleItemChange}
      onAddLine={addLine}
      depositAmount={depositAmount}
      onDepositAmountChange={setDepositAmount}
      depositMethod={depositMethod}
      onDepositMethodChange={setDepositMethod}
      totalValue={totalValue}
      saving={saving}
      hasCashSession={Boolean(cashSession)}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/commerce/layaways")}
    />
  );

  return (
    <PageShell
      title="Nuevo apartado"
      description="Reserva productos para un cliente con un anticipo. El stock físico solo baja al completar."
    >
      {(formError ?? error) && (
        <Alert variant="error" title="Error" message={(formError ?? error)!} />
      )}
      {!loadingCashSession && !cashSession && (
        <Alert
          variant="warning"
          title="Sin sesión de caja"
          message="Abre una sesión de caja en Caja antes de apartar."
        />
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
