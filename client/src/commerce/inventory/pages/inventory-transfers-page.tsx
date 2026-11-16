import { useEffect, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryTransfers } from "../hooks/use-inventory-transfers";
import { useBranches } from "@identity/branches/hooks/use-branches";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import Alert from "@ui/alert/alert";
import PageShell from "@common/components/page-shell/page-shell";

const InventoryTransfersPage: React.FC = () => {
  const { items, fetchAll: fetchItems } = useInventory();
  const { branches, fetchAll: fetchBranches } = useBranches();
  const { transfers, creating, error, fetchAll: fetchTransfers, create } = useInventoryTransfers();

  const [fromItemId, setFromItemId] = useState("");
  const [toItemId, setToItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchBranches();
    fetchTransfers();
  }, [fetchItems, fetchBranches, fetchTransfers]);

  const branchName = (branchId: string) => branches.find((b) => b.id === branchId)?.name ?? `Sucursal ${branchId}`;
  const itemLabel = (item: (typeof items)[number]) =>
    `${item.name} (${branchName(item.localId)}, stock: ${item.quantityOnHand})`;
  const itemNameById = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item ? `${item.name} (${branchName(item.localId)})` : `Item ${itemId}`;
  };

  const fromItem = items.find((i) => i.id === fromItemId);
  const toItem = items.find((i) => i.id === toItemId);
  const sameBranch = Boolean(fromItem && toItem && fromItem.localId === toItem.localId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromItemId || !toItemId || Number(quantity) <= 0 || sameBranch) return;

    const ok = await create({
      fromInventoryItemId: fromItemId,
      toInventoryItemId: toItemId,
      quantity: Number(quantity),
      reason: reason || undefined,
    });

    if (ok) {
      setSuccessMsg("Transferencia registrada.");
      setFromItemId("");
      setToItemId("");
      setQuantity("1");
      setReason("");
      fetchItems();
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <PageShell
      title="Transferencias entre sucursales"
      description="Mueve cantidad de un item a otro item ya existente en otra sucursal. No crea items nuevos."
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-gray-500">Item origen</Label>
            <Select
              value={fromItemId}
              onChange={setFromItemId}
              placeholder="Selecciona el item de origen"
              options={items.map((i) => ({ value: i.id, label: itemLabel(i) }))}
            />
          </div>
          <div>
            <Label className="text-gray-500">Item destino</Label>
            <Select
              value={toItemId}
              onChange={setToItemId}
              placeholder="Selecciona el item de destino"
              options={items.filter((i) => i.id !== fromItemId).map((i) => ({ value: i.id, label: itemLabel(i) }))}
            />
          </div>
        </div>
        {sameBranch && (
          <p className="text-sm text-red-500">El item origen y destino pertenecen a la misma sucursal.</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-gray-500">Cantidad</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <Label className="text-gray-500">Motivo (opcional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={creating || !fromItemId || !toItemId || Number(quantity) <= 0 || sameBranch}
        >
          <ArrowRightLeft className="mr-1.5 size-4" />
          {creating ? "Transfiriendo..." : "Transferir"}
        </Button>
      </form>

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
              <span className="text-gray-400">{new Date(t.createdAt).toLocaleString("es-MX")}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default InventoryTransfersPage;
