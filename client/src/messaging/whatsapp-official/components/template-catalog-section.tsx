import { ScrollTable } from "@ui/table/scroll-table";
import { useEffect, useState } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import {
  useWhatsappTemplateCatalog,
  type CreateWhatsappTemplateCatalogEntryInput,
  type WhatsappTemplateCatalogEntryRow,
  type WhatsappTemplateCategory,
} from "../hooks/use-whatsapp-template-catalog";
import type { WhatsappTemplateSyncStatus } from "../hooks/use-whatsapp-templates";
import { Badge } from "@ui/badge/badge";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { TextArea } from "@ui/textarea/textarea";
import { Modal } from "@ui/modal/modal";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import {
  EMPTY_CATALOG_FORM,
  CATEGORY_OPTIONS,
  STATUS_BADGE,
  parseVariables,
} from "../utils/format";

interface TemplateCatalogSectionProps {
  scope: "tenant" | "system";
  title: string;
  description: string;
  readOnly?: boolean;
  statusByEntryId?: Map<
    string,
    { status: WhatsappTemplateSyncStatus; lastSyncedAt: string | null }
  >;
}

// Una plantilla con disparador automático (ej. order_ready) muestra el aviso
// pero NUNCA bloquea el borrado -- el usuario pidió "totalmente
// administrable" (ver plan Fase 4, Checkpoint 7).
export const TemplateCatalogSection: React.FC<TemplateCatalogSectionProps> = ({
  scope,
  title,
  description,
  readOnly = false,
  statusByEntryId,
}) => {
  const { entries, loading, saving, fetchEntries, create, update, remove } =
    useWhatsappTemplateCatalog(scope);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WhatsappTemplateCatalogEntryRow | null>(null);
  const [form, setForm] = useState(EMPTY_CATALOG_FORM);
  const [deletingEntry, setDeletingEntry] = useState<WhatsappTemplateCatalogEntryRow | null>(null);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setEditingEntry(null);
    setForm(EMPTY_CATALOG_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: WhatsappTemplateCatalogEntryRow) => {
    setEditingEntry(entry);
    setForm({
      key: entry.key,
      metaName: entry.metaName,
      category: entry.category,
      language: entry.language,
      text: entry.text,
      variablesText: entry.variables.join(", "),
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const variables = parseVariables(form.variablesText);
    const ok = editingEntry
      ? await update(editingEntry.id, { text: form.text, variables })
      : await create({
          key: form.key,
          metaName: form.metaName,
          category: form.category,
          language: form.language,
          text: form.text,
          variables,
        } as CreateWhatsappTemplateCatalogEntryInput);
    if (ok) setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    const ok = await remove(deletingEntry.id);
    if (ok) setDeletingEntry(null);
  };

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        {!readOnly && (
          <Button variant="outline" onClick={openCreateForm}>
            Nueva plantilla
          </Button>
        )}
      </div>

      {loading && entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
          <MessageCircle className="size-10 opacity-40" />
          <p className="text-sm">Sin plantillas todavía.</p>
        </div>
      ) : (
        <ScrollTable
          header={
            <tr>
              <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                Plantilla
              </th>
              <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                Categoría
              </th>
              {statusByEntryId && (
                <>
                  <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                    Status en Meta
                  </th>
                  <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                    Última sincronización
                  </th>
                </>
              )}
              {!readOnly && (
                <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              )}
            </tr>
          }
        >
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => {
              const liveStatus = statusByEntryId?.get(entry.id);
              const badge = liveStatus ? STATUS_BADGE[liveStatus.status] : null;
              return (
                <tr key={entry.id}>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    <div className="min-w-0 text-right xl:text-left">
                      <div className="font-medium">{entry.key}</div>
                      <div className="text-xs text-gray-400">{entry.metaName}</div>
                      {entry.triggerEvent && (
                        <div className="mt-0.5 text-xs text-gray-400">
                          Disparador automático: {entry.triggerEvent}
                        </div>
                      )}
                      {!entry.enabled && <Badge color="error">Deshabilitada</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{entry.category}</td>
                  {statusByEntryId && (
                    <>
                      <td className="px-5 py-4">
                        {badge ? (
                          <Badge color={badge.color}>{badge.label}</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Sin sincronizar</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {liveStatus?.lastSyncedAt
                          ? new Date(liveStatus.lastSyncedAt).toLocaleString()
                          : "—"}
                      </td>
                    </>
                  )}
                  {!readOnly && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(entry)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-brand-500"
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEntry(entry)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-error-500"
                          aria-label="Borrar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </ScrollTable>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        className="max-w-lg p-6 sm:p-8 mx-4"
      >
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {editingEntry ? "Editar plantilla" : "Nueva plantilla"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-500">Key</Label>
              <Input
                value={form.key}
                onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))}
                required
                disabled={saving || !!editingEntry}
              />
            </div>
            <div>
              <Label className="text-gray-500">Nombre en Meta</Label>
              <Input
                value={form.metaName}
                onChange={(event) => setForm((prev) => ({ ...prev, metaName: event.target.value }))}
                required
                disabled={saving || !!editingEntry}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-500">Categoría</Label>
              <Select
                value={form.category}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, category: value as WhatsappTemplateCategory }))
                }
                disabled={saving || !!editingEntry}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <Label className="text-gray-500">Idioma</Label>
              <Input
                value={form.language}
                onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
                required
                disabled={saving || !!editingEntry}
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-500">Texto</Label>
            <TextArea
              value={form.text}
              onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
              rows={3}
              disabled={saving}
              required
            />
          </div>
          <div>
            <Label className="text-gray-500">Variables (separadas por coma)</Label>
            <Input
              placeholder="nombre, modelo"
              value={form.variablesText}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, variablesText: event.target.value }))
              }
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-400">
              Cada nombre debe aparecer en el texto como {"{{nombre}}"}.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingEntry}
        title="Borrar plantilla"
        message={`¿Borrar "${deletingEntry?.key}"? Si ya está registrada en Meta, se borra también allá.`}
        confirmLabel="Borrar"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeletingEntry(null)}
      />
    </div>
  );
};
