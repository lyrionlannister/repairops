import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useQuotes } from "../hooks/use-quotes";
import { useQuotesPage } from "../hooks/use-quotes-page";
import { Button } from "@ui/button/button";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePermissions } from "@common/hooks/use-permissions";
import { QuotesFilterBar } from "../components/quotes-filter-bar";
import { QuotesTable } from "../components/quotes-table";

export const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();
  const { deleteQuote, setStatus } = useQuotes();
  const { search, setSearch, statusFilter, setStatusFilter, deletingId, list, hasFilters, handleDelete, handleStatusChange } =
    useQuotesPage({ deleteQuote, setStatus });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

      <QuotesFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <QuotesTable
        error={list.items.length === 0 ? list.error : null}
        onRetry={() => void list.refetch()}
        canEdit={canAny("quotes.write", "quotes.write.own")}
        canDelete={can("quotes.delete")}
        loading={list.loading}
        hasFilters={hasFilters}
        pageItems={list.items}
        deletingId={deletingId}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        totalItems={list.total}
        startIndex={list.startIndex}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
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
