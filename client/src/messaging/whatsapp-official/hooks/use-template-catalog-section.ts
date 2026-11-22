import { useEffect, useState } from "react";
import {
  useWhatsappTemplateCatalog,
  type CreateWhatsappTemplateCatalogEntryInput,
  type WhatsappTemplateCatalogEntryRow,
} from "./use-whatsapp-template-catalog";
import { EMPTY_CATALOG_FORM, entryToCatalogForm, parseVariables, type CatalogFormData } from "../utils/format";

export const useTemplateCatalogSection = (scope: "tenant" | "system") => {
  const { entries, loading, saving, fetchEntries, create, update, remove } = useWhatsappTemplateCatalog(scope);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WhatsappTemplateCatalogEntryRow | null>(null);
  const [form, setForm] = useState<CatalogFormData>(EMPTY_CATALOG_FORM);
  const [deletingEntry, setDeletingEntry] = useState<WhatsappTemplateCatalogEntryRow | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openCreateForm = () => {
    setEditingEntry(null);
    setForm(EMPTY_CATALOG_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: WhatsappTemplateCatalogEntryRow) => {
    setEditingEntry(entry);
    setForm(entryToCatalogForm(entry));
    setIsFormOpen(true);
  };

  const setField = <K extends keyof CatalogFormData>(field: K, value: CatalogFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
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

  const confirmDelete = async () => {
    if (!deletingEntry) return;
    if (await remove(deletingEntry.id)) setDeletingEntry(null);
  };

  return {
    entries,
    loading,
    saving,
    isFormOpen,
    isEditing: editingEntry !== null,
    form,
    deletingEntry,
    openCreateForm,
    openEditForm,
    closeForm: () => setIsFormOpen(false),
    setField,
    submit,
    requestDelete: setDeletingEntry,
    cancelDelete: () => setDeletingEntry(null),
    confirmDelete,
  };
};
