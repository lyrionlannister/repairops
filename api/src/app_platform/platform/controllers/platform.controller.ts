import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AuthService } from "../../../identity/auth/services/auth.service.js";
import { RegisterUserDto } from "../../../identity/auth/dtos/register-user.dto.js";
import { getValidationMessages } from "../../../identity/auth/helpers/auth.helpers.js";
import type { AuthenticatedRequest } from "../../../identity/auth/middlewares/auth.middleware.js";
import { sendError } from "../../../core/http/error-response.js";
import { CreateInvitationDto } from "../dtos/create-invitation.dto.js";

// Solo platform-admin (ver platform.routes.ts): crea talleres cuando el
// registro público está cerrado e invitaciones de un solo uso en modo invite.
@singleton()
export class PlatformController {
  constructor(private authService: AuthService) {}

  createTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(RegisterUserDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: getValidationMessages(errors) });
        return;
      }
      const { owner, tenant } = await this.authService.createTenantByAdmin(dto);
      res.status(201).json({
        message: "Taller creado",
        tenant: { publicId: tenant.publicId, name: tenant.name },
        owner,
      });
    } catch (error) {
      sendError(res, error, 400, "Error al crear el taller");
    }
  };

  createInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const dto = plainToInstance(CreateInvitationDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        res.status(400).json({ error: getValidationMessages(errors) });
        return;
      }
      const { token, expiresAt } = await this.authService.createInvitation({
        email: dto.email ?? null,
        expiresInDays: dto.expiresInDays,
        createdByAdminId: req.user?.id ?? null,
      });
      res.status(201).json({ message: "Invitación creada", token, expiresAt });
    } catch (error) {
      sendError(res, error, 400, "Error al crear la invitación");
    }
  };

  listInvitations = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.authService.listPendingInvitations());
    } catch (error) {
      sendError(res, error, 500, "Error al listar las invitaciones");
    }
  };
}
