import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Lock } from "lucide-react";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryCounts } from "../hooks/use-inventory-counts";
import { useBranches } from "@identity/branches/hooks/use-branches";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import Alert from "@ui/alert/alert";
import PageShell from "@common/components/page-shell/page-shell";

type LineDraft = { countedQuantity: string; reason: string };

const InventoryCountPage: React.FC = () => {
  const { items, fetchAll: fetchItems } = useInventory();
  const { branches, fetchAll: fetchBranches } = useBranches();
  const { count, saving, error, missingReasonItemIds, open, setCounted, close } = useInventoryCounts();

  const [branchId, setBranchId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LineDraft>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchBranches();
  }, [fetchItems, fetchBranches]);

  const itemName = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? `${item.name}${item.sku ? ` (${item.sku})` : ""}` : `Item ${id}`;
  };

  const handleOpen = async () => {
    if (!branchId) return;
    setDrafts({});
    await open(branchId);
  };

  const draftFor = (countItemId: string): LineDraft => drafts[countItemId] ?? { countedQuantity: "", reason: "" };
  const updateDraft = (countItemId: string, patch: Partial<LineDraft>) => {
    setDrafts((prev) => ({ ...prev, [countItemId]: { ...draftFor(countItemId), ...patch } }));
  };

  const handleSaveLine = async (countItemId: string) => {
    const draft = draftFor(countItemId);
    if (draft.countedQuantity === "") return;
    await setCounted(countItemId, Number(draft.countedQuantity), draft.reason || undefined);
  };

  const handleClose = async () => {
    const ok = await close();
    if (ok) {
      setSuccessMsg("Conteo cerrado. Ajustes aplicados sobre el stock real.");
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const isOpen = count?.status === "open";
  const missingSet = useMemo(() => new Set(missingReasonItemIds), [missingReasonItemIds]);

  return (
    <PageShell
      title="Conteo de inventario"
      description="Captura lo que cuentas físicamente. El esperado no se muestra hasta cerrar el conteo."
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}

      {!count && (
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="w-60">
            <Label className="text-gray-500">Sucursal</Label>
            <Select
              value={branchId}
              onChange={setBranchId}
              placeholder="Selecciona una sucursal"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
          <Button type="button" variant="primary" onClick={handleOpen} disabled={saving || !branchId}>
            <ClipboardCheck className="mr-1.5 size-4" />
            Abrir conteo
          </Button>
        </div>
      )}

      {count && (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
              Conteo #{count.id} {!isOpen && <Lock className="ml-1 inline size-4 text-gray-400" />}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{isOpen ? "Abierto" : "Cerrado"}</span>
          </div>

          <div className="space-y-3">
            {(count.items ?? []).map((item) => {
              const draft = draftFor(item.id);
              const needsReason = missingSet.has(item.id);
              return (
                <div key={item.id} className="flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-end dark:border-gray-800">
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                    {itemName(item.inventoryItemId)}
                    {item.countedQuantity !== null && <span className="text-gray-400"> · capturado: {item.countedQuantity}</span>}
                  </div>
                  {isOpen ? (
                    <>
                      <div className="w-full sm:w-28">
                        <Input
                          type="number"
                          placeholder="Contado"
                          value={draft.countedQuantity}
                          onChange={(e) => updateDraft(item.id, { countedQuantity: e.target.value })}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder={needsReason ? "Motivo requerido" : "Motivo (si hay diferencia)"}
                          value={draft.reason}
                          onChange={(e) => updateDraft(item.id, { reason: e.target.value })}
                          error={needsReason}
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={() => handleSaveLine(item.id)} disabled={saving}>
                        Guardar
                      </Button>
                    </>
                  ) : (
                    item.reason && <span className="text-sm text-gray-500 dark:text-gray-400">{item.reason}</span>
                  )}
                </div>
              );
            })}
          </div>

          {isOpen && (
            <Button type="button" variant="primary" className="w-full" onClick={handleClose} disabled={saving}>
              Cerrar conteo
            </Button>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default InventoryCountPage;
