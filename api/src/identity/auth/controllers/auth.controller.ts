import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  AUTH_MESSAGES,
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../constants/auth.constants.js";
import { getValidationMessages } from "../helpers/auth.helpers.js";
import { AuthService } from "../services/auth.service.js";
import { PresenceService } from "../services/presence.service.js";
import { RegisterUserDto } from "../dtos/register-user.dto.js";
import { LoginUserDto } from "../dtos/login-user.dto.js";
import { CreateEmployeeDto } from "../dtos/create-employee.dto.js";
import { UpdateEmployeeDto } from "../dtos/update-employee.dto.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { readCookie } from "../middlewares/auth.middleware.js";
import { sendError } from "../../../core/http/error-response.js";

// Escribe el par de sesión: access de 15 min + refresh de 7 días (ambos
// httpOnly). El cliente renueva solo con POST /auth/refresh.
const setSessionCookies = (res: Response, token: string, refreshToken: string): void => {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...ACCESS_TOKEN_COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...REFRESH_TOKEN_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

const clearSessionCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS);
  res.clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_OPTIONS);
};

@singleton()
export class AuthController {
  constructor(
    private authService: AuthService,
    private presenceService: PresenceService,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RegisterUserDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = getValidationMessages(errors);
        res.status(400).json({ error: messages });
        return;
      }

      const { owner, token, refreshToken } = await this.authService.register(dto);

      // Auto-login: el owner entra directo al onboarding de planes sin
      // pasar otra vez por /login (mismo mecanismo de cookie que login).
      setSessionCookies(res, token, refreshToken);

      res.status(201).json({
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        user: owner,
      });
    } catch (error) {
      sendError(res, error, 400, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [users, online] = await Promise.all([
        this.authService.getAllUsers(),
        this.presenceService.listOnline(),
      ]);
      res.status(200).json(users.map((user) => ({ ...user, online: online.has(String(user.id)) })));
    } catch (error) {
      sendError(res, error, 500, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateEmployeeDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = getValidationMessages(errors);
        res.status(400).json({ error: messages });
        return;
      }

      const user = await this.authService.createEmployee(dto);
      res.status(201).json({ message: AUTH_MESSAGES.REGISTER_SUCCESS, user });
    } catch (error) {
      sendError(res, error, 400, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const dto = plainToInstance(UpdateEmployeeDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = getValidationMessages(errors);
        res.status(400).json({ error: messages });
        return;
      }

      const user = await this.authService.updateEmployee(id, dto);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      sendError(res, error, 400, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.authService.getMe(req.user!.id);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      sendError(res, error, 500, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  listRoles = (_req: Request, res: Response): void => {
    res.status(200).json(this.authService.listRoles());
  };

  listEmployees = async (_req: Request, res: Response): Promise<void> => {
    try {
      const employees = await this.authService.listEmployees();
      res.status(200).json(employees);
    } catch (error) {
      sendError(res, error, 500, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const user = await this.authService.toggleUserStatus(id);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      sendError(res, error, 500, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(LoginUserDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = getValidationMessages(errors);
        res.status(400).json({ error: messages });
        return;
      }

      const { user, token, refreshToken } = await this.authService.login(dto);

      // httpOnly: el token nunca llega al JSON ni es legible por JS (OWASP
      // Session Management Cheat Sheet) -- viaja solo por Set-Cookie.
      setSessionCookies(res, token, refreshToken);

      res.status(200).json({
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        user,
      });
    } catch (error) {
      sendError(res, error, 401, AUTH_MESSAGES.LOGIN_ERROR);
    }
  };

  // Renueva la sesión con el refresh token (rotación): si el refresh no
  // es válido, 401 y el cliente redirige al login.
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = readCookie(req, REFRESH_TOKEN_COOKIE);
      if (!refreshToken) {
        res.status(401).json({ error: "Sesión expirada" });
        return;
      }
      const {
        user,
        token,
        refreshToken: nextRefreshToken,
      } = await this.authService.refreshSession(refreshToken);
      setSessionCookies(res, token, nextRefreshToken);
      res.status(200).json({ message: "Sesión renovada", user });
    } catch (error) {
      sendError(res, error, 401, "Sesión expirada");
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    // Revoca el refresh token: sin él, el access token que queda (15 min
    // como máximo) no se puede renovar.
    await this.authService.revokeSession(readCookie(req, REFRESH_TOKEN_COOKIE));
    clearSessionCookies(res);
    res.status(200).json({ message: AUTH_MESSAGES.LOGOUT_SUCCESS });
  };
}
