import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../jwt-secret.js";
import type { UserRole } from "../entities/user.entity.js";
import type { Permission } from "../../authz/permissions.js";
import { ACCESS_TOKEN_COOKIE } from "../constants/auth.constants.js";

const { verify } = jwt;

// El JWT solo prueba identidad (public_id del usuario y del tenant, email): ningun id
// interno viaja en el token. id, tenantId, roles, permisos y el flag de plataforma los completa
// tenantMiddleware desde la base en cada petición.
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    publicId: string;
    email: string;
    tenantId: string;
    tenantPublicId: string;
    roles?: UserRole[];
    permissions?: ReadonlySet<Permission>;
    isPlatformAdmin?: boolean;
  };
}

// Sin cookie-parser: solo necesitamos leer un valor, no vale la pena la
// dependencia por esto. req.headers.cookie llega como "a=1; b=2".
export const readCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const match = header.split("; ").find((pair) => pair.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  // Orden: header Authorization (clientes no-browser, scripts) y cookie
  // httpOnly (el SPA). Sin fallback por query string: EventSource manda
  // cookies con withCredentials, así que ningún cliente actual lo necesita,
  // y un token en la URL termina en logs del servidor y del proxy.
  const token = req.headers.authorization?.split(" ")[1] ?? readCookie(req, ACCESS_TOKEN_COOKIE);

  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const decoded = verify(token, requireJwtSecret());
    const { id, email, tenantId } = decoded as { id: string; email: string; tenantId: string };
    req.user = { id: "", publicId: id, email, tenantId: "", tenantPublicId: tenantId };
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      res.status(401).json({ error: "Sesion expirada" });
    } else {
      res.status(401).json({ error: "Token invalido" });
    }
  }
};
