// Unico lugar de todo api/src que lee process.env directamente. Cualquier
// variable de entorno nueva se agrega aqui, nunca con process.env suelto en
// otro archivo -- asi queda un solo lugar para ver que variables existen y
// cuales son opcionales vs obligatorias.
export function env(name: string): string | undefined {
  return process.env[name];
}

export function requiredEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return env(name) ?? fallback;
}

export function optionalEnvNumber(name: string, fallback: number): number {
  const raw = env(name);
  return raw ? Number(raw) : fallback;
}

export function isProduction(): boolean {
  return env("NODE_ENV") === "production";
}
