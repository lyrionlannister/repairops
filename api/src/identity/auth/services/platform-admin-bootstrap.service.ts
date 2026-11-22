import { singleton } from "tsyringe";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UserDao } from "../daos/user.dao.js";
import { AuthService } from "./auth.service.js";
import { RegisterUserDto } from "../dtos/register-user.dto.js";
import { env } from "../../../core/config/env.js";
import { allowSystemScope } from "../../../core/tenancy/tenant-context.js";
import { flattenValidationErrors } from "../../../core/common/utils/validation-errors.js";

export type PlatformAdminBootstrapResult = "skipped" | "created" | "exists" | "conflict";

@singleton()
export class PlatformAdminBootstrapService {
  constructor(
    private userDao: UserDao,
    private authService: AuthService,
  ) {}

  async ensureFromEnv(): Promise<PlatformAdminBootstrapResult> {
    const email = env("PLATFORM_ADMIN_EMAIL")?.trim();
    const password = env("PLATFORM_ADMIN_PASSWORD");
    if (!email || !password) return "skipped";

    const dto = plainToInstance(RegisterUserDto, {
      firstName: "Admin",
      lastName: "Plataforma",
      email,
      password,
    });
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new Error(`PLATFORM_ADMIN_* inválido: ${flattenValidationErrors(errors).join(", ")}`);
    }

    const existing = await allowSystemScope(() => this.userDao.findByEmailAcrossTenants(email));
    if (existing?.isPlatformAdmin) return "exists";
    // POST /register es público: promover un email ya registrado le daría
    // acceso de plataforma a quien lo haya registrado primero.
    if (existing) return "conflict";

    await this.authService.registerPlatformAdmin(dto);
    return "created";
  }
}
