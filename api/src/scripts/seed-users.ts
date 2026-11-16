import "reflect-metadata";
import { hash } from "bcryptjs";
import AppDataSource from "../core/config/data-source.js";
import { runWithTenant, allowSystemScope } from "../core/tenancy/tenant-context.js";
import { Tenant } from "../core/tenancy/entities/tenant.entity.js";
import { User } from "../identity/auth/entities/user.entity.js";
import { UserDao } from "../identity/auth/daos/user.dao.js";
import { ServiceType } from "../commerce/service-types/entities/service-type.entity.js";
import { ServiceTypeDao } from "../commerce/service-types/daos/service-type.dao.js";
import { ServiceTypeService } from "../commerce/service-types/services/service-type.service.js";
import { Branch } from "../identity/branches/entities/branch.entity.js";
import { BranchDao } from "../identity/branches/daos/branch.dao.js";
import { BranchService } from "../identity/branches/services/branch.service.js";

const ADMIN = {
  email: "admin@local.test",
  password: "AdminLocal123!",
  firstName: "Admin",
  lastName: "Local",
};

// Script manual (pnpm seed:users), nunca enganchado al boot del server.
// Siembra solo el admin de plataforma para entorno local -- ver
// resources/access.txt. Los demas usuarios (operador, tester) se crean
// desde la UI (Usuarios), no por seed.
async function main(): Promise<void> {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const userDao = new UserDao(userRepository);

  const existing = await allowSystemScope(() => userDao.findByEmailAcrossTenants(ADMIN.email));
  if (existing) {
    console.log(`${ADMIN.email} ya existe, no se vuelve a sembrar.`);
    return AppDataSource.destroy();
  }

  const tenant = await allowSystemScope(() =>
    AppDataSource.getRepository(Tenant).save(
      AppDataSource.getRepository(Tenant).create({ name: ADMIN.email }),
    ),
  );

  await runWithTenant(tenant.id, async () => {
    const hashedPassword = await hash(ADMIN.password, 10);
    await userDao.create({
      firstName: ADMIN.firstName,
      lastName: ADMIN.lastName,
      email: ADMIN.email,
      password: hashedPassword,
      role: "owner",
      isPlatformAdmin: true,
    });

    await new ServiceTypeService(new ServiceTypeDao(AppDataSource.getRepository(ServiceType))).seed();
    await new BranchService(new BranchDao(AppDataSource.getRepository(Branch))).seed({});

    console.log(`Admin de plataforma sembrado: ${ADMIN.email}`);
  });

  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error("Error sembrando el admin de plataforma:", error);
  process.exitCode = 1;
});
