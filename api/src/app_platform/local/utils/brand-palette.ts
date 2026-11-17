export interface BrandPalette {
  base: string;
  dark: string;
  mid: string;
  footer: string;
  light: string;
  border: string;
  onBrand: string;
}

// Azul actual de los documentos: un tenant sin color elegido ve exactamente esto.
export const DEFAULT_BRAND_PALETTE: BrandPalette = {
  base: "#2563eb",
  dark: "#1e40af",
  mid: "#3b82f6",
  footer: "#2563eb",
  light: "#eff6ff",
  border: "#bfdbfe",
  onBrand: "#ffffff",
};

export const BRAND_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

const WHITE = "#ffffff";
const INK = "#111827";
const BLACK = "#000000";
const MIN_CONTRAST = 4.5;

type Hsl = { h: number; s: number; l: number };

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function pickOnBrand(base: string): string {
  const best = contrastRatio(base, WHITE) >= contrastRatio(base, INK) ? WHITE : INK;
  return contrastRatio(base, best) >= MIN_CONTRAST ? best : BLACK;
}

// Se llama una sola vez, en el API: el cliente y los PDF consumen la paleta ya derivada.
export function buildBrandPalette(baseColor: string | null | undefined): BrandPalette {
  if (!baseColor || !BRAND_COLOR_PATTERN.test(baseColor)) return DEFAULT_BRAND_PALETTE;

  const hsl = hexToHsl(baseColor);
  let darkL = Math.min(hsl.l * 0.75, 0.4);
  let dark = hslToHex({ ...hsl, l: darkL });
  while (contrastRatio(dark, WHITE) < MIN_CONTRAST && darkL > 0) {
    darkL = Math.max(0, darkL - 0.02);
    dark = hslToHex({ ...hsl, l: darkL });
  }

  return {
    base: baseColor,
    dark,
    mid: hslToHex({ ...hsl, l: Math.min(hsl.l + 0.12, 0.72) }),
    footer: baseColor,
    light: hslToHex({ h: hsl.h, s: Math.min(hsl.s, 0.9), l: 0.96 }),
    border: hslToHex({ h: hsl.h, s: Math.min(hsl.s, 0.9), l: 0.87 }),
    onBrand: pickOnBrand(baseColor),
  };
}
