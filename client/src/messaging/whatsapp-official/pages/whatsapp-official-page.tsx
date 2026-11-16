import { useEffect, useState } from "react";
import { MessageCircle, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { useWhatsappAccount } from "../hooks/use-whatsapp-account";
import { useWhatsappTemplates, type WhatsappTemplateSyncStatus } from "../hooks/use-whatsapp-templates";
import {
  useWhatsappTemplateCatalog,
  type CreateWhatsappTemplateCatalogEntryInput,
  type WhatsappTemplateCatalogEntryRow,
  type WhatsappTemplateCategory,
} from "../hooks/use-whatsapp-template-catalog";
import { useCurrentUser } from "@common/hooks/use-current-user";
import { Alert } from "@ui/alert/alert";
import { Badge } from "@ui/badge/badge";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { TextArea } from "@ui/textarea/textarea";
import { Modal } from "@ui/modal/modal";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";

const EMPTY_CONNECT_FORM = { wabaId: "", phoneNumberId: "", accessToken: "" };

const EMPTY_CATALOG_FORM = {
  key: "",
  metaName: "",
  category: "UTILITY" as WhatsappTemplateCategory,
  language: "es_MX",
  text: "",
  variablesText: "",
};

const CATEGORY_OPTIONS: { value: WhatsappTemplateCategory; label: string }[] = [
  { value: "UTILITY", label: "Utilidad" },
  { value: "MARKETING", label: "Marketing" },
  { value: "AUTHENTICATION", label: "Autenticación" },
];

const STATUS_BADGE: Record<WhatsappTemplateSyncStatus, { label: string; color: "success" | "warning" | "error" }> = {
  APPROVED: { label: "Aprobada", color: "success" },
  PENDING: { label: "Pendiente de Meta", color: "warning" },
  REJECTED: { label: "Rechazada", color: "error" },
};

function parseVariables(variablesText: string): string[] {
  return variablesText
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

interface TemplateCatalogSectionProps {
  scope: "tenant" | "system";
  title: string;
  description: string;
  statusByEntryId?: Map<string, { status: WhatsappTemplateSyncStatus; lastSyncedAt: string | null }>;
}

// Una plantilla con disparador automático (ej. order_ready) muestra el aviso
// pero NUNCA bloquea el borrado -- el usuario pidió "totalmente
// administrable" (ver plan Fase 4, Checkpoint 7).
const TemplateCatalogSection = ({ scope, title, description, statusByEntryId }: TemplateCatalogSectionProps) => {
  const { entries, loading, saving, error, fetchEntries, create, update, remove } =
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

  const handleSubmit = async (event: React.FormEvent) => {
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <Button variant="outline" onClick={openCreateForm}>
          Nueva plantilla
        </Button>
      </div>

      {error && <div className="p-4"><Alert variant="error" title="Error" message={error} /></div>}

      {loading && entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
          <MessageCircle className="size-10 opacity-40" />
          <p className="text-sm">Sin plantillas todavía.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/2">
            <tr>
              <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Plantilla</th>
              <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Categoría</th>
              {statusByEntryId && (
                <>
                  <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status en Meta</th>
                  <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Última sincronización</th>
                </>
              )}
              <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => {
              const liveStatus = statusByEntryId?.get(entry.id);
              const badge = liveStatus ? STATUS_BADGE[liveStatus.status] : null;
              return (
                <tr key={entry.id}>
                  <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    <div className="font-medium">{entry.key}</div>
                    <div className="text-xs text-gray-400">{entry.metaName}</div>
                    {entry.triggerEvent && (
                      <div className="mt-0.5 text-xs text-gray-400">Disparador automático: {entry.triggerEvent}</div>
                    )}
                    {!entry.enabled && <Badge color="error">Deshabilitada</Badge>}
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{entry.category}</td>
                  {statusByEntryId && (
                    <>
                      <td className="px-5 py-4">
                        {badge ? <Badge color={badge.color}>{badge.label}</Badge> : <span className="text-xs text-gray-400">Sin sincronizar</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {liveStatus?.lastSyncedAt ? new Date(liveStatus.lastSyncedAt).toLocaleString() : "—"}
                      </td>
                    </>
                  )}
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(entry)}
                        className="text-gray-400 hover:text-brand-500"
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEntry(entry)}
                        className="text-gray-400 hover:text-error-500"
                        aria-label="Borrar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg p-6 sm:p-8 mx-4">
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
                onChange={(value) => setForm((prev) => ({ ...prev, category: value as WhatsappTemplateCategory }))}
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
              onChange={(event) => setForm((prev) => ({ ...prev, variablesText: event.target.value }))}
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-400">
              Cada nombre debe aparecer en el texto como {"{{nombre}}"}.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
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

export const WhatsappOfficialPage = () => {
  const currentUser = useCurrentUser();
  const {
    account,
    loading: accountLoading,
    error: accountError,
    fetchStatus,
    connecting,
    connectError,
    connectAccount,
  } = useWhatsappAccount();
  const { templates, loading: templatesLoading, error: templatesError, sync } = useWhatsappTemplates();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectForm, setConnectForm] = useState(EMPTY_CONNECT_FORM);

  useEffect(() => {
    fetchStatus();
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await connectAccount(connectForm);
    if (ok) {
      setIsConnectOpen(false);
      setConnectForm(EMPTY_CONNECT_FORM);
      sync();
    }
  };

  const statusByEntryId = new Map(templates.map((t) => [t.catalogEntryId, { status: t.status, lastSyncedAt: t.lastSyncedAt }]));

  return (
    <PageShell
      title="WhatsApp"
      description="Cuenta oficial (Graph API) y plantillas proactivas aprobadas por Meta."
      action={
        <Button variant="outline" onClick={sync} disabled={templatesLoading}>
          <RefreshCw className={`mr-1.5 size-4 ${templatesLoading ? "animate-spin" : ""}`} />
          {templatesLoading ? "Sincronizando..." : "Sincronizar con Meta"}
        </Button>
      }
    >
      {accountError && <Alert variant="error" title="Error" message={accountError} />}
      {templatesError && <Alert variant="error" title="Error al sincronizar" message={templatesError} />}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center justify-between">
          <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Cuenta conectada</h2>
          <Button
            variant="outline"
            onClick={() => {
              setConnectForm(EMPTY_CONNECT_FORM);
              setIsConnectOpen(true);
            }}
          >
            Usar mi propia cuenta
          </Button>
        </div>
        {accountLoading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : account ? (
          <div className="flex items-center gap-3">
            <Badge color={account.status === "connected" ? "success" : "error"}>
              {account.status === "connected" ? "Conectada" : "Desconectada"}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">{account.phoneNumberId}</span>
            {account.ownedByPlatform && (
              <span className="text-xs text-gray-400">(cuenta piloto compartida)</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin información todavía.</p>
        )}
      </div>

      <Modal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        className="max-w-md p-6 sm:p-8 mx-4"
      >
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Conectar cuenta propia</h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Pega las credenciales de tu WABA generadas en Meta Business Manager. Usa un token de
          sistema permanente, no uno de usuario de corta duración -- se validan contra Meta antes de
          guardarse.
        </p>
        {connectError && <Alert variant="error" title="Meta rechazó las credenciales" message={connectError} />}
        <form onSubmit={handleConnectAccount} className="mt-4 space-y-4">
          <div>
            <Label className="text-gray-500">WABA ID</Label>
            <Input
              value={connectForm.wabaId}
              onChange={(event) => setConnectForm((prev) => ({ ...prev, wabaId: event.target.value }))}
              required
              disabled={connecting}
            />
          </div>
          <div>
            <Label className="text-gray-500">Phone Number ID</Label>
            <Input
              value={connectForm.phoneNumberId}
              onChange={(event) => setConnectForm((prev) => ({ ...prev, phoneNumberId: event.target.value }))}
              required
              disabled={connecting}
            />
          </div>
          <div>
            <Label className="text-gray-500">Access Token</Label>
            <Input
              type="password"
              value={connectForm.accessToken}
              onChange={(event) => setConnectForm((prev) => ({ ...prev, accessToken: event.target.value }))}
              required
              disabled={connecting}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setIsConnectOpen(false)} disabled={connecting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={connecting}>
              {connecting ? "Validando con Meta..." : "Conectar"}
            </Button>
          </div>
        </form>
      </Modal>

      <TemplateCatalogSection
        scope="tenant"
        title="Plantillas de la empresa"
        description="Catálogo proactivo de este taller -- se sincroniza con la WABA conectada."
        statusByEntryId={statusByEntryId}
      />

      {currentUser?.isPlatformAdmin && (
        <TemplateCatalogSection
          scope="system"
          title="Plantillas de sistema"
          description="Configuración de la plataforma misma, no de ningún taller -- todavía sin sincronizar con Meta."
        />
      )}
    </PageShell>
  );
};

