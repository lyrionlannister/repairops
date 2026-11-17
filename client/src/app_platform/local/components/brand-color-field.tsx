import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";

import type { BrandPalette } from "../hooks/use-local";

interface BrandColorFieldProps {
  value: string;
  palette: BrandPalette | null;
  disabled: boolean;
  onChange: (value: string) => void;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// La paleta de la vista previa llega ya derivada del API: el cliente no calcula colores.
export const BrandColorField: React.FC<BrandColorFieldProps> = ({ value, palette, disabled, onChange }) => (
  <div>
    <Label className="text-gray-500">Color de marca</Label>
    <div className="mt-1 flex flex-wrap items-center gap-3">
      <input
        type="color"
        aria-label="Elegir color de marca"
        value={HEX.test(value) ? value : "#2563eb"}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="size-11 cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700"
      />
      <Input
        className="max-w-36"
        placeholder="#2563eb"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <Button type="button" variant="outline" onClick={() => onChange("")} disabled={disabled || !value}>
        Restablecer
      </Button>
    </div>
    {palette && (
      <div className="mt-3 flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700" aria-hidden>
        <div className="flex-1 px-3 py-2 text-xs font-semibold" style={{ background: palette.footer, color: palette.onBrand }}>
          Encabezado y pie
        </div>
        <div className="flex-1 px-3 py-2 text-xs font-semibold" style={{ background: palette.light, color: palette.dark, borderLeft: `1px solid ${palette.border}` }}>
          Tarjetas y títulos
        </div>
      </div>
    )}
    <p className="mt-1 text-xs text-gray-400">
      Se aplica a la nota y a la cotización en carta. El ticket térmico y el QR siempre van en negro. Vacío usa el azul de siempre.
    </p>
  </div>
);
