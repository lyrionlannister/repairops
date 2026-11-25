import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { getValidationMessages } from "../helpers/auth.helpers.js";
import { PasswordResetService } from "../services/password-reset.service.js";
import { RequestPasswordResetDto } from "../dtos/request-password-reset.dto.js";
import { ResetPasswordDto } from "../dtos/reset-password.dto.js";
import { sendError } from "../../../core/http/error-response.js";

@singleton()
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  requestReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RequestPasswordResetDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: getValidationMessages(errors) });
        return;
      }
      await this.passwordResetService.requestReset(dto.email);
      res.status(200).json({
        message: "Si el correo está registrado, te enviamos un enlace para cambiar tu contraseña.",
      });
    } catch (error) {
      sendError(res, error, 400, "No pudimos enviar el correo. Intenta de nuevo.");
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(ResetPasswordDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: getValidationMessages(errors) });
        return;
      }
      await this.passwordResetService.resetPassword(dto.token, dto.password);
      res.status(200).json({ message: "Tu contraseña se cambió. Ya puedes iniciar sesión." });
    } catch (error) {
      sendError(res, error, 400, "No pudimos cambiar tu contraseña. Intenta de nuevo.");
    }
  };
}
