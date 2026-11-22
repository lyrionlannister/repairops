import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useQuotes } from "../hooks/use-quotes";
import { useQuotesPage } from "../hooks/use-quotes-page";
import { Button } from "@ui/button/button";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { usePermissions } from "@common/hooks/use-permissions";
import { QuotesFilterBar } from "../components/quotes-filter-bar";
import { QuotesTable } from "../components/quotes-table";

export const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();
  const { quotes, loading, error, fetchQuotes, deleteQuote, setStatus } = useQuotes();
  const { search, setSearch, statusFilter, setStatusFilter, deletingId, filteredQuotes, handleDelete, handleStatusChange } =
    useQuotesPage({ quotes, deleteQuote, setStatus });
  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredQuotes);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return (
    <PageShell
      title="Cotizaciones"
      description="Genera y da seguimiento a cotizaciones para clientes."
      action={
        // El formulario no liga la cotización a una nota: quien solo cotiza sus notas no crea desde aquí.
        can("quotes.write") && (
          <Button variant="primary" startIcon={<Plus className="size-4" />} onClick={() => navigate("/commerce/quotes/new")}>
            Nueva cotización
          </Button>
        )
      }
    >
      {error && <div className="text-sm text-red-500">{error}</div>}

      <QuotesFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      />

      <QuotesTable
        canEdit={canAny("quotes.write", "quotes.write.own")}
        canDelete={can("quotes.delete")}
        loading={loading}
        quotes={quotes}
        filteredQuotes={filteredQuotes}
        pageItems={pageItems}
        deletingId={deletingId}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onStatusChange={handleStatusChange}
        onRequestDelete={setDeleteConfirmId}
      />

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Eliminar cotización"
        message="¿Eliminar esta cotización? Esta acción no se puede deshacer."
        danger
        loading={deletingId !== null}
        onConfirm={async () => {
          if (deleteConfirmId) await handleDelete(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};
