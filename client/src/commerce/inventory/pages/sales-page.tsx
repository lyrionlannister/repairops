import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useSalesPage } from "../hooks/use-sales-page";
import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";
import { SalesFilterBar } from "../components/sales-filter-bar";
import { SalesTable } from "../components/sales-table";

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { search, setSearch, list } = useSalesPage();

  return (
    <PageShell
      title="Ventas"
      description="Historial de ventas registradas."
      action={
        <Button
          variant="primary"
          startIcon={<Plus className="size-4" />}
          onClick={() => navigate("/commerce/sales/new")}
        >
          Venta rápida
        </Button>
      }
    >
      <SalesFilterBar search={search} onSearchChange={setSearch} />

      <SalesTable
        error={list.items.length === 0 ? list.error : null}
        onRetry={() => void list.refetch()}
        loading={list.loading}
        hasFilters={list.hasSearch}
        pageItems={list.items}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        totalItems={list.total}
        startIndex={list.startIndex}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
      />
    </PageShell>
  );
};
