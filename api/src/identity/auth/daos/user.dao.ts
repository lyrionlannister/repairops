import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { User } from "../entities/user.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class UserDao extends TenantScopedDao<User> {
  constructor(@inject(repositoryToken(User)) repository: Repository<User>) {
    super(repository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  // Unica excepcion deliberada al filtro de tenant: en login todavia no se
  // sabe a que tenant pertenece el usuario, asi que se busca por email en
  // todos los tenants. Solo usar dentro de allowSystemScope(), nunca para
  // listar/editar datos de negocio.
  async findByEmailAcrossTenants(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  async countActive(): Promise<number> {
    return this.scoped("user").andWhere("user.isActive = true").getCount();
  }

  async toggleStatus(id: string): Promise<User | null> {
    const user = await this.findOne({ id });
    if (!user) return null;
    user.isActive = !user.isActive;
    return this.repository.save(user);
  }
}
