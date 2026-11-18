import { useEffect, useState } from "react";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryTransfers } from "../hooks/use-inventory-transfers";
import { useInventoryTransferLabels } from "../hooks/use-inventory-transfer-labels";
import { useBranches } from "@identity/branches/hooks/use-branches";
import { PageShell } from "@common/components/page-shell/page-shell";
import { InventoryTransferForm } from "../components/inventory-transfer-form";
import { formatDate } from "../utils/format";

export const InventoryTransfersPage: React.FC = () => {
  const { items, fetchAll: fetchItems } = useInventory();
  const { branches, fetchAll: fetchBranches } = useBranches();
  const { transfers, creating, fetchAll: fetchTransfers, create } = useInventoryTransfers();

  const [fromItemId, setFromItemId] = useState("");
  const [toItemId, setToItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchItems();
    fetchBranches();
    fetchTransfers();
  }, [fetchItems, fetchBranches, fetchTransfers]);

  const { itemLabel, itemNameById } = useInventoryTransferLabels(items, branches);

  const fromItem = items.find((i) => i.id === fromItemId);
  const toItem = items.find((i) => i.id === toItemId);
  const sameBranch = Boolean(fromItem && toItem && fromItem.localId === toItem.localId);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fromItemId || !toItemId || Number(quantity) <= 0 || sameBranch) return;

    const ok = await create({
      fromInventoryItemId: fromItemId,
      toInventoryItemId: toItemId,
      quantity: Number(quantity),
      reason: reason || undefined,
    });

    if (ok) {
      setFromItemId("");
      setToItemId("");
      setQuantity("1");
      setReason("");
      fetchItems();
    }
  };

  return (
    <PageShell
      title="Transferencias entre sucursales"
      description="Pasa unidades de un producto a su equivalente en otra sucursal. No crea productos nuevos."
    >

      <InventoryTransferForm
        items={items}
        itemLabel={itemLabel}
        fromItemId={fromItemId}
        onFromItemIdChange={setFromItemId}
        toItemId={toItemId}
        onToItemIdChange={setToItemId}
        sameBranch={sameBranch}
        quantity={quantity}
        onQuantityChange={setQuantity}
        reason={reason}
        onReasonChange={setReason}
        creating={creating}
        disabled={creating || !fromItemId || !toItemId || Number(quantity) <= 0 || sameBranch}
        onSubmit={handleSubmit}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-3 text-lg font-medium text-gray-800 dark:text-white/90">Historial</h2>
        <div className="space-y-2">
          {transfers.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Sin transferencias todavía.</p>}
          {transfers.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>
                {t.quantity} {t.quantity === 1 ? "unidad" : "unidades"} de{" "}
                <strong className="font-medium text-gray-800 dark:text-white/90">{itemNameById(t.fromInventoryItemId)}</strong>{" "}
                a <strong className="font-medium text-gray-800 dark:text-white/90">{itemNameById(t.toInventoryItemId)}</strong>
                {t.reason ? ` · ${t.reason}` : ""}
              </span>
              <span className="text-gray-400">{formatDate(t.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

