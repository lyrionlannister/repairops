import AppDataSource from "../../src/core/config/data-source.js";
import { UserRoleAssignment } from "../../src/identity/auth/entities/user-role.entity.js";
import { UserRoleDao } from "../../src/identity/auth/daos/user-role.dao.js";
import { Branch } from "../../src/identity/branches/entities/branch.entity.js";
import { BranchDao } from "../../src/identity/branches/daos/branch.dao.js";
import { BranchDiscountCap } from "../../src/identity/branches/entities/branch-discount-cap.entity.js";
import { BranchDiscountCapDao } from "../../src/identity/branches/daos/branch-discount-cap.dao.js";
import { BranchDiscountCapService } from "../../src/identity/branches/services/branch-discount-cap.service.js";

// Dependencias reales (Postgres) que los services de caja y venta piden desde los roles.
export const makeUserRoleDao = (): UserRoleDao =>
  new UserRoleDao(AppDataSource.getRepository(UserRoleAssignment));

export const makeDiscountCapService = (): BranchDiscountCapService =>
  new BranchDiscountCapService(
    new BranchDiscountCapDao(AppDataSource.getRepository(BranchDiscountCap)),
    new BranchDao(AppDataSource.getRepository(Branch)),
  );
