import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../jwt-secret.js";
import { UserRole } from "../entities/user.entity.js";
import { ACCESS_TOKEN_COOKIE } from "../constants/auth.constants.js";

const { verify } = jwt;

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; tenantId: string; role: UserRole; isPlatformAdmin?: boolean };
}

// Sin cookie-parser: solo necesitamos leer un valor, no vale la pena la
// dependencia por esto. req.headers.cookie llega como "a=1; b=2".
const readCookie = (req: Request, name: string): string | undefined => {
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
  // Orden: header Authorization (clientes no-browser, scripts), cookie
  // httpOnly (el SPA, desde la migracion a cookie para que el token no sea
  // legible por JS), y por ultimo query string como fallback para
  // EventSource (SSE), que no puede mandar headers custom.
  const token =
    req.headers.authorization?.split(" ")[1] ??
    readCookie(req, ACCESS_TOKEN_COOKIE) ??
    (req.query.token as string | undefined);

  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const decoded = verify(token, requireJwtSecret());
    req.user = decoded as { id: string; email: string; tenantId: string; role: UserRole; isPlatformAdmin?: boolean };
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ error: "Sesion expirada" });
    } else {
      res.status(401).json({ error: "Token invalido" });
    }
  }
};
