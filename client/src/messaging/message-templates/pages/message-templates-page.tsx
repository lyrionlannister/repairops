import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquareText, Plus, Pencil, Search, Trash2 } from "lucide-react";

import { Alert } from "@ui/alert/alert";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";

import { useMessageTemplates } from "../hooks/use-message-templates";
import { useMessageTemplatesPage } from "../hooks/use-message-templates-page";

export const MessageTemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, loading, saving, error, fetchAll, remove } = useMessageTemplates();
  const { search, setSearch, filteredTemplates } = useMessageTemplatesPage(templates);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredTemplates);

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) {
      setSuccessMsg("Template eliminado.");
      window.setTimeout(() => setSuccessMsg(null), 3000);
    }
    setDeleteConfirmId(null);
  };

  return (
    <PageShell
      title="Templates de Mensajes"
      description="Mensajes predefinidos que usa el agente de WhatsApp."
      action={
        <Button variant="primary" onClick={() => navigate("/app/templates/new")}>
          <Plus className="mr-1.5 size-4" />
          Nuevo template
        </Button>
      }
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}

      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Buscar template"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando templates...</div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
            <MessageSquareText className="size-10 opacity-40" />
            <p className="text-sm">No hay templates. Crea uno con el botón de arriba.</p>
          </div>
        ) : (
          <ScrollTable
            className="min-w-150"
            colgroup={
              <colgroup>
                <col className="w-48" />
                <col />
                <col />
                <col className="w-28" />
              </colgroup>
            }
            header={
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Clave</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Descripción</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Mensaje</th>
                <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            }
          >
            <tbody>
              {pageItems.map((template) => (
                <tr
                  key={template.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
                >
                  <td className="px-4 py-4 align-top">
                    <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-brand-600 dark:bg-gray-800 dark:text-brand-400">
                      {template.key}
                    </code>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-gray-500 dark:text-gray-400">{template.description ?? "—"}</td>
                  <td className="px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-300">
                    <p className="line-clamp-2">{template.text}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/app/templates/${template.id}/edit`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(template.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        title="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
        )}

        {!loading && totalItems > 0 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-11 rounded-lg md:h-9 border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>
                Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} de {totalItems}
              </span>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Eliminar template"
        message="¿Eliminar este template de mensaje? Esta acción no se puede deshacer."
        danger
        loading={saving}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};

