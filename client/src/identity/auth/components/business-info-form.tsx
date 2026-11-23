import type { FC } from "react";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Button } from "@ui/button/button";
import type { BusinessInfoFormProps } from "../props/business-info-form-props";

export const BusinessInfoForm: FC<BusinessInfoFormProps> = ({
  form,
  saving,
  error,
  onChange,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <div>
      <Label htmlFor="name" className="text-gray-500">
        Nombre del taller <span className="text-error-500">*</span>
      </Label>
      <Input
        id="name"
        name="name"
        placeholder="Ej. Kaltra Fix"
        value={form.name}
        onChange={onChange}
        disabled={saving}
        required
      />
    </div>

    <div>
      <Label htmlFor="phone" className="text-gray-500">
        Teléfono
      </Label>
      <Input
        id="phone"
        name="phone"
        placeholder="Ej. 833 266 2225"
        value={form.phone}
        onChange={onChange}
        disabled={saving}
      />
    </div>

    <div>
      <Label htmlFor="address" className="text-gray-500">
        Dirección
      </Label>
      <Input
        id="address"
        name="address"
        placeholder="Ej. Benito Juárez 304 Local 107-109, Zona Centro"
        value={form.address}
        onChange={onChange}
        disabled={saving}
      />
    </div>

    {error && <p className="text-sm text-error-500">{error}</p>}

    <Button type="submit" variant="primary" className="w-full" disabled={saving}>
      {saving ? "Guardando..." : "Continuar"}
    </Button>
  </form>
);
