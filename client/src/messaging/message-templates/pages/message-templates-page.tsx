import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquareText, Plus, Pencil, Search, Trash2 } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { DataTable } from "@ui/table/data-table";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";

import { useMessageTemplates } from "../hooks/use-message-templates";
import { useMessageTemplatesPage } from "../hooks/use-message-templates-page";

export const MessageTemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, loading, saving, fetchAll, remove } = useMessageTemplates();
  const { search, setSearch, filteredTemplates } = useMessageTemplatesPage(templates);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredTemplates);

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteConfirmId(null);
  };

  return (
    <PageShell
      title="Templates de Mensajes"
      description="Mensajes predefinidos que usa el agente de WhatsApp."
      action={
        <Button variant="primary" onClick={() => navigate("/messaging/message-templates/new")}>
          <Plus className="mr-1.5 size-4" />
          Nuevo template
        </Button>
      }
    >
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar template"
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        loading={loading}
        loadingText="Cargando templates..."
        isEmpty={pageItems.length === 0}
        empty={{
          icon: <MessageSquareText />,
          title:
            templates.length === 0
              ? "No hay templates registrados."
              : "Sin resultados para la búsqueda.",
          description:
            templates.length === 0
              ? "Crea el primero para que el agente de WhatsApp lo use."
              : "Prueba con otro término.",
          action: (
            <Button
              variant="primary"
              startIcon={<Plus className="size-4" />}
              onClick={() => navigate("/messaging/message-templates/new")}
            >
              Nuevo template
            </Button>
          ),
        }}
        pagination={{
          page,
          pageSize,
          totalPages,
          totalItems,
          startIndex,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
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
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Clave
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Descripción
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Mensaje
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Acciones
            </th>
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
              <td className="px-4 py-4 align-top text-sm text-gray-500 dark:text-gray-400">
                {template.description ?? "—"}
              </td>
              <td className="px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-300">
                <p className="line-clamp-2">{template.text}</p>
              </td>
              <td className="px-4 py-4 align-top text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/messaging/message-templates/${template.id}/edit`)}
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
      </DataTable>

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
