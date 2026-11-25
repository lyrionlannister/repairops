export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: "Usuario registrado exitosamente",
  LOGIN_SUCCESS: "Sesión iniciada exitosamente",
  LOGOUT_SUCCESS: "Sesión cerrada",
  REGISTER_ERROR: "Error en el registro",
  LOGIN_ERROR: "Error al iniciar sesión",
} as const;

// httpOnly + secure + sameSite=strict: el token nunca es legible por JS (ni
// con XSS), y al ser api.kaltra.local y app.kaltra.local mismo site (misma
// eTLD+1), sameSite=strict igual viaja en el fetch cross-subdomain.
export const ACCESS_TOKEN_COOKIE = "accessToken";
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
} as const;
// El access token dura 15 minutos: si se roba, expira solo. La sesión se
// renueva con el refresh token (POST /auth/refresh) sin pedir la contraseña.
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

// Refresh token: 7 días, con rotación en cada uso y revocación en servidor.
// `path` restringe la cookie a las rutas de auth, así no viaja en cada
// petición a la API.
export const REFRESH_TOKEN_COOKIE = "refreshToken";
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/api/v1/auth",
} as const;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Enlace de verificación de correo: 24 horas, de un solo uso.
export const EMAIL_VERIFICATION_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Enlace para restablecer contraseña: 1 hora, de un solo uso.
export const PASSWORD_RESET_TOKEN_MAX_AGE_MS = 60 * 60 * 1000;
