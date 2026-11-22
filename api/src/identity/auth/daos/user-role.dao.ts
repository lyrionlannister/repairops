import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { UserRoleAssignment } from "../entities/user-role.entity.js";
import type { UserRole } from "../entities/user.entity.js";

@singleton()
export class UserRoleDao extends TenantScopedDao<UserRoleAssignment> {
  constructor(@inject(repositoryToken(UserRoleAssignment)) repository: Repository<UserRoleAssignment>) {
    super(repository);
  }

  async findRolesOf(userId: string): Promise<UserRole[]> {
    const rows = await this.scoped("ur").andWhere("ur.userId = :userId", { userId }).orderBy("ur.role", "ASC").getMany();
    return rows.map((row) => row.role);
  }

  async findAllOfTenant(): Promise<Map<string, UserRole[]>> {
    const result = new Map<string, UserRole[]>();
    for (const row of await this.scoped("ur").orderBy("ur.role", "ASC").getMany()) {
      result.set(String(row.userId), [...(result.get(String(row.userId)) ?? []), row.role]);
    }
    return result;
  }

  // Dueños activos del taller, opcionalmente sin contar a un usuario.
  async countActiveOwners(exceptUserId?: string): Promise<number> {
    const query = this.scoped("ur")
      .innerJoin("ur.user", "user", "user.isActive = true")
      .andWhere("ur.role = 'owner'");
    if (exceptUserId) query.andWhere("ur.userId <> :exceptUserId", { exceptUserId });
    return query.getCount();
  }

  async replaceForUser(userId: string, roles: readonly UserRole[]): Promise<void> {
    const tenantId = this.currentTenantId();
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(UserRoleAssignment, { tenantId, userId } as never);
      for (const role of roles) {
        await manager.insert(UserRoleAssignment, { tenantId, userId, role } as never);
      }
    });
  }
}
