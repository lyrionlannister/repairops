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
export const ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
