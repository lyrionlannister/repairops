import type { FC } from "react";
import { Mail, Pencil, Phone } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import type { CustomerProfileCardProps } from "../props/customer-profile-card-props";

export const CustomerProfileCard: FC<CustomerProfileCardProps> = ({
  customer,
  editing,
  draft,
  saving,
  error,
  onDraftChange,
  onStart,
  onCancel,
  onSave,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Datos del cliente</h3>
      {!editing && (
        <Button variant="outline" startIcon={<Pencil className="size-4" />} onClick={onStart}>
          Editar
        </Button>
      )}
    </div>

    {editing ? (
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div>
          <Label className="text-gray-500">Nombre</Label>
          <Input
            required
            value={draft.name}
            onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
            disabled={saving}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-gray-500">Teléfono</Label>
            <Input
              required
              value={draft.phone}
              onChange={(e) => onDraftChange({ ...draft, phone: e.target.value })}
              disabled={saving}
            />
          </div>
          <div>
            <Label className="text-gray-500">Email (opcional)</Label>
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => onDraftChange({ ...draft, email: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    ) : (
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <dt className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Phone className="size-4" />
          </dt>
          <dd className="font-medium text-gray-800 dark:text-white/90">{customer.phone}</dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Mail className="size-4" />
          </dt>
          <dd
            className={
              customer.email ? "font-medium text-gray-800 dark:text-white/90" : "text-gray-400"
            }
          >
            {customer.email || "Sin email"}
          </dd>
        </div>
      </dl>
    )}
  </div>
);
