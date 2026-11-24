// Unico lugar de todo api/src que lee process.env directamente. Cualquier
// variable de entorno nueva se agrega aqui, nunca con process.env suelto en
// otro archivo -- asi queda un solo lugar para ver que variables existen y
// cuales son opcionales vs obligatorias.
export function env(name: string): string | undefined {
  return process.env[name];
}

export function requiredEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return env(name) ?? fallback;
}

export function optionalEnvNumber(name: string, fallback: number): number {
  const raw = env(name);
  return raw ? Number(raw) : fallback;
}

// Modo de registro de tenants nuevos. `open` (default, autoservicio): cada
// taller se registra solo; el abuso se controla con rate limiting en
// POST /register, verificación de correo (Resend) y captcha.
// `closed`: POST /register rechaza y solo el platform-admin crea tenants
// (o invitaciones). `invite`: el registro exige un token de invitación
// de un solo uso.
export type RegistrationMode = "open" | "closed" | "invite";

export function registrationMode(): RegistrationMode {
  const raw = (env("REGISTRATION_MODE") ?? "open").toLowerCase();
  if (raw === "open" || raw === "closed" || raw === "invite") return raw;
  throw new Error(`REGISTRATION_MODE inválido: ${raw} (open|closed|invite)`);
}

export function isProduction(): boolean {
  return env("NODE_ENV") === "production";
}
