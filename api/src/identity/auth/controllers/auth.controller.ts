import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  AUTH_MESSAGES,
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE_MS,
} from "../constants/auth.constants.js";
import { getValidationMessages } from "../helpers/auth.helpers.js";
import { AuthService } from "../services/auth.service.js";
import { RegisterUserDto } from "../dtos/register-user.dto.js";
import { LoginUserDto } from "../dtos/login-user.dto.js";
import { CreateEmployeeDto } from "../dtos/create-employee.dto.js";
import { UpdateEmployeeDto } from "../dtos/update-employee.dto.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RegisterUserDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = getValidationMessages(errors);
        res.status(400).json({ error: messages });
        return;
      }

      const user = await this.authService.register(dto);
      const { password, ...userWithoutPassword } = user;

      res.status(201).json({
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      sendError(res, error, 400, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.authService.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      sendError(res, error, 500, AUTH_MESSAGES.REGISTER_ERROR);
    }
  };

  listEmployees = async (_req: Request, res: Response): Promise<void> => {
    try {
      const employees = await this.authService.listEmployees();
      res.status(200).json(employees);
    } catch (error: any) {
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
    } catch (error: any) {
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

      const { user, token } = await this.authService.login(dto);

      // httpOnly: el token nunca llega al JSON ni es legible por JS (OWASP
      // Session Management Cheat Sheet) -- viaja solo por Set-Cookie.
      res.cookie(ACCESS_TOKEN_COOKIE, token, {
        ...ACCESS_TOKEN_COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      });

      res.status(200).json({
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        user,
      });
    } catch (error: any) {
      sendError(res, error, 401, AUTH_MESSAGES.LOGIN_ERROR);
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.status(200).json({ message: AUTH_MESSAGES.LOGOUT_SUCCESS });
  };
}
