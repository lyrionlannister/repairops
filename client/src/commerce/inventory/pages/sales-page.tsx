import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useSales } from "../hooks/use-sales";
import { useSalesPage } from "../hooks/use-sales-page";
import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { SalesFilterBar } from "../components/sales-filter-bar";
import { SalesTable } from "../components/sales-table";

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { sales, loading, error, fetchAll } = useSales();
  const { search, setSearch, filteredSales } = useSalesPage(sales);
  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredSales);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <PageShell
      title="Ventas"
      description="Historial de ventas registradas."
      action={
        <Button variant="primary" startIcon={<Plus className="size-4" />} onClick={() => navigate("/commerce/sales/new")}>
          Venta rápida
        </Button>
      }
    >
      {error && <div className="text-sm text-red-500">{error}</div>}

      <SalesFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <SalesTable
        loading={loading}
        sales={sales}
        filteredSales={filteredSales}
        pageItems={pageItems}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </PageShell>
  );
};
