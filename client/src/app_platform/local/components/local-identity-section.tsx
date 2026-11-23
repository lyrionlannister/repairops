import type { FC } from "react";
import { Store } from "lucide-react";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { BrandColorField } from "./brand-color-field";
import { LocalLetterheadPreview } from "./local-letterhead-preview";
import { SettingsSection } from "./settings-section";
import { previewAccent } from "../utils/local-form";
import type { LocalIdentitySectionProps } from "../props/local-identity-section-props";

export const LocalIdentitySection: FC<LocalIdentitySectionProps> = ({
  form,
  palette,
  saving,
  fileInputRef,
  onChange,
  onLogoChange,
  onRemoveLogo,
  onSetBrandColor,
}) => (
  <SettingsSection
    tab="identity"
    title="Identidad del taller"
    description="Así aparece tu local en notas, cotizaciones y tickets impresos."
    aside={
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Vista previa</p>
        <LocalLetterheadPreview
          name={form.name}
          phone={form.phone}
          address={form.address}
          logo={form.logo}
          accent={previewAccent(form.brandColor, palette)}
        />
      </div>
    }
  >
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
          {form.logo ? (
            <img src={form.logo} alt="Logo del local" className="size-full object-contain" />
          ) : (
            <Store className="size-7 text-gray-400" aria-hidden />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.logo ? "Cambiar logo" : "Subir logo"}
            </Button>
            {form.logo && (
              <Button type="button" variant="outline" disabled={saving} onClick={onRemoveLogo}>
                Quitar logo
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-400">PNG o JPG cuadrado, recomendado 200 × 200 px.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onLogoChange}
        />
      </div>

      <BrandColorField
        value={form.brandColor}
        palette={palette}
        disabled={saving}
        onChange={onSetBrandColor}
      />
    </div>

    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label htmlFor="name" className="text-gray-500">
          Nombre del local
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
      <div className="md:col-span-2 lg:col-span-1">
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
    </div>
  </SettingsSection>
);
