import { PageShell } from "@common/components/page-shell/page-shell";
import { useInventoryTransfersPage } from "../hooks/use-inventory-transfers-page";
import { InventoryTransferForm } from "../components/inventory-transfer-form";
import { InventoryTransferHistory } from "../components/inventory-transfer-history";

export const InventoryTransfersPage: React.FC = () => {
  const page = useInventoryTransfersPage();
  const { history } = page;

  return (
    <PageShell
      title="Transferencias entre sucursales"
      description="Pasa unidades de un producto a su equivalente en otra sucursal. No crea productos nuevos."
    >
      <InventoryTransferForm
        key={page.formKey}
        itemLabel={page.labels.itemLabel}
        fromItem={page.fromItem}
        onFromItemChange={page.setFromItem}
        toItem={page.toItem}
        onToItemChange={page.setToItem}
        sameItem={page.sameItem}
        sameBranch={page.sameBranch}
        exceedsStock={page.exceedsStock}
        quantity={page.quantity}
        onQuantityChange={page.setQuantity}
        reason={page.reason}
        onReasonChange={page.setReason}
        creating={page.creating}
        disabled={!page.canSubmit}
        onSubmit={page.handleSubmit}
      />

      <InventoryTransferHistory
        transfers={history.items}
        loading={history.loading}
        error={history.error}
        onRetry={() => void history.refetch()}
        refLabel={page.labels.refLabel}
        pagination={{
          page: history.page,
          pageSize: history.pageSize,
          totalPages: history.totalPages,
          totalItems: history.total,
          startIndex: history.startIndex,
          onPageChange: history.setPage,
          onPageSizeChange: history.setPageSize,
        }}
      />
    </PageShell>
  );
};
