import { singleton, inject } from "tsyringe";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { Repository } from "typeorm";
import { UserDao } from "../daos/user.dao.js";
import { UserRoleDao } from "../daos/user-role.dao.js";
import { RegisterUserDto } from "../dtos/register-user.dto.js";
import { LoginUserDto } from "../dtos/login-user.dto.js";
import { CreateEmployeeDto } from "../dtos/create-employee.dto.js";
import { UpdateEmployeeDto } from "../dtos/update-employee.dto.js";
import { User, type UserRole } from "../entities/user.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { requireJwtSecret } from "../jwt-secret.js";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { runInTransaction } from "../../../core/database/transaction-context.js";
import { ServiceTypeService } from "../../../commerce/service-types/services/service-type.service.js";
import { BranchService } from "../../branches/services/branch.service.js";
import {
  UserBranchService,
  type BranchAssignment,
} from "../../branches/services/user-branch.service.js";
import { BillingService } from "../../../app_platform/billing/services/billing.service.js";
import { PlanLimitService } from "../../../app_platform/billing/services/plan-limit.service.js";
import { effectivePermissions, type Permission } from "../../authz/permissions.js";

const { sign } = jwt;

export class UserRoleRuleError extends Error {}

export type PublicUser = Omit<User, "password"> & { roles: UserRole[] };
export type SessionUser = PublicUser & { permissions: Permission[] };

const withoutPassword = ({ password, ...rest }: User): Omit<User, "password"> => rest;

@singleton()
export class AuthService {
  constructor(
    private userDao: UserDao,
    @inject(repositoryToken(Tenant)) private tenantRepository: Repository<Tenant>,
    private serviceTypeService: ServiceTypeService,
    private branchService: BranchService,
    private userBranchService: UserBranchService,
    private billingService: BillingService,
    private planLimitService: PlanLimitService,
    private userRoleDao: UserRoleDao,
  ) {}

  async register(data: RegisterUserDto): Promise<User> {
    return this.createTenantWithOwner(data, false);
  }

  async registerPlatformAdmin(data: RegisterUserDto): Promise<User> {
    return this.createTenantWithOwner(data, true);
  }

  private async createTenantWithOwner(
    data: RegisterUserDto,
    isPlatformAdmin: boolean,
  ): Promise<User> {
    // Sin tenant en contexto todavia, igual que login: el email solo se
    // puede checar sin ambiguedad en scope de sistema. Si esto corriera
    // despues de crear el Tenant, el check siempre pasaria en falso -- un
    // tenant recien creado nunca tiene usuarios, sin importar que el email
    // ya exista en otro.
    const existingUser = await allowSystemScope(() =>
      this.userDao.findByEmailAcrossTenants(data.email),
    );
    if (existingUser) {
      throw new Error("Email ya registrado");
    }

    const tenant = await allowSystemScope(() =>
      this.tenantRepository.save(this.tenantRepository.create({ name: data.email })),
    );

    // No esta envuelto en una transaccion de DB: si el insert del usuario
    // fallara, queda un Tenant huerfano sin dueno (basura inocua, no un
    // problema de integridad de datos como el de numero_control). La
    // suscripcion va antes que el dueno para que nunca exista un dueno sin plan.
    return runWithTenant(tenant.id, async () => {
      await this.billingService.startSubscription(
        isPlatformAdmin ? "platform" : "basico",
        isPlatformAdmin ? "active" : "trialing",
      );

      const hashedPassword = await hash(data.password, 10);

      const owner = await this.userDao.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        isPlatformAdmin,
      });
      await this.userRoleDao.replaceForUser(owner.id, ["owner"]);

      // Defaults del tenant nuevo -- una sola vez, aqui, no en cada arranque
      // del server (ver core/seed, retirado: ese barrido no escala con
      // muchos tenants y hacia esto mismo en cada boot).
      await this.serviceTypeService.seed();
      await this.branchService.seed({});

      return owner;
    });
  }

  // Cada usuario sale con sus roles y sus sucursales (branchIds y la principal); el owner
  // no tiene filas de sucursal.
  async getAllUsers(): Promise<Array<PublicUser & BranchAssignment>> {
    const [users, assignments, roles] = await Promise.all([
      this.userDao.findAll(),
      this.userBranchService.getAssignments(),
      this.userRoleDao.findAllOfTenant(),
    ]);
    return users.map((user) => ({
      ...withoutPassword(user),
      roles: roles.get(String(user.id)) ?? [],
      ...(assignments.get(String(user.id)) ?? { branchIds: [], primaryBranchId: null }),
    }));
  }

  // Empleado nuevo dentro del tenant ya resuelto por tenantMiddleware -- a
  // diferencia de register(), nunca crea un Tenant.
  async createEmployee(data: CreateEmployeeDto): Promise<PublicUser> {
    const existingUser = await this.userDao.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email ya registrado");
    }

    const roles = this.normalizeRoles(data.roles);
    // Las sucursales se validan antes de crear nada: un usuario sin sucursal no puede operar.
    const assignment = await this.userBranchService.normalize(
      roles,
      data.branchIds,
      data.primaryBranchId,
    );

    const hashedPassword = await hash(data.password, 10);

    const user = await this.planLimitService.withCapacity("users", async () => {
      const created = await this.userDao.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        salaryAmount: data.salaryAmount ?? null,
        payCycle: data.payCycle ?? null,
      });
      await this.userRoleDao.replaceForUser(created.id, roles);
      await this.userBranchService.assign(created.id, assignment);
      return created;
    });

    return { ...withoutPassword(user), roles };
  }

  // A diferencia de createEmployee, password es opcional: solo se re-hashea
  // y reemplaza si llega no vacio, nunca se borra la contrasena actual por
  // dejar el campo en blanco en el form de edicion.
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<PublicUser | null> {
    const existingUser = await this.userDao.findByEmail(data.email);
    if (existingUser && existingUser.id !== id) {
      throw new Error("Email ya registrado");
    }

    const target = await this.userDao.findById(id);
    if (!target) return null;
    const currentRoles = await this.userRoleDao.findRolesOf(id);
    const roles = data.roles ? this.normalizeRoles(data.roles) : currentRoles;

    // Sin branchIds se conservan las actuales; si el usuario deja de ser owner debe tener sucursales.
    const current = (await this.userBranchService.getAssignments()).get(String(id));
    const assignment = await this.userBranchService.normalize(
      roles,
      data.branchIds ?? current?.branchIds,
      data.primaryBranchId ??
        (data.branchIds ? undefined : (current?.primaryBranchId ?? undefined)),
    );

    const updatePayload: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      salaryAmount: data.salaryAmount ?? null,
      payCycle: data.payCycle ?? null,
    };
    if (data.password) {
      updatePayload.password = await hash(data.password, 10);
    }

    const user = await runInTransaction(async () => {
      if (target.isActive && currentRoles.includes("owner") && !roles.includes("owner")) {
        await this.assertAnotherActiveOwner(id);
      }
      const updated = await this.userDao.update(id, updatePayload);
      if (!updated) return null;
      await this.userRoleDao.replaceForUser(updated.id, roles);
      await this.userBranchService.assign(updated.id, assignment);
      return updated;
    });
    return user ? { ...withoutPassword(user), roles } : null;
  }

  // Listado ligero para poblar los <Select> de empleado en otros modulos.
  async listEmployees(): Promise<
    Array<Pick<User, "id" | "firstName" | "lastName"> & { roles: UserRole[] }>
  > {
    const [users, roles] = await Promise.all([
      this.userDao.findAll(),
      this.userRoleDao.findAllOfTenant(),
    ]);
    return users.map(({ id, firstName, lastName }) => ({
      id,
      firstName,
      lastName,
      roles: roles.get(String(id)) ?? [],
    }));
  }

  // Resolver nombre de un empleado puntual (p.ej. para el PDF de una nota).
  async getEmployeeName(id: string): Promise<string | null> {
    const user = await this.userDao.findById(id);
    return user ? `${user.firstName} ${user.lastName}`.trim() : null;
  }

  // Perfil del propio usuario autenticado -- a diferencia del JWT (que solo
  // prueba identidad), esto siempre lee la fila actual, asi que recoge cambios
  // de roles/nombre hechos por un admin despues de que el usuario inicio sesion.
  async getMe(id: string): Promise<SessionUser | null> {
    const user = await this.userDao.findById(id);
    if (!user) return null;
    return this.toSessionUser(user);
  }

  async toggleUserStatus(id: string): Promise<PublicUser | null> {
    const current = await this.userDao.findById(id);
    if (!current) return null;
    const user = current.isActive
      ? await runInTransaction(async () => {
          if ((await this.userRoleDao.findRolesOf(id)).includes("owner"))
            await this.assertAnotherActiveOwner(id);
          return this.userDao.toggleStatus(id);
        })
      : await this.planLimitService.withCapacity("users", () => this.userDao.toggleStatus(id));
    if (!user) return null;
    return { ...withoutPassword(user), roles: await this.userRoleDao.findRolesOf(id) };
  }

  async login(data: LoginUserDto): Promise<{ user: SessionUser; token: string }> {
    // findByEmail necesita tenant en contexto, pero en login todavia no se
    // sabe el tenant del usuario: se busca en scope de sistema por email
    // (unico campo sin ambiguedad antes de autenticar) y luego se re-entra
    // al tenant real para el resto de la operacion.
    const user = await allowSystemScope(() => this.userDao.findByEmailAcrossTenants(data.email));
    if (!user) {
      throw new Error("Email no registrado");
    }

    return runWithTenant(user.tenantId, async () => {
      const isPasswordValid = await compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error("Contraseña invalida");
      }

      if (!user.isActive) {
        throw new Error("Usuario inactivo");
      }

      // Solo identidad: roles, permisos y el flag de plataforma se leen de la base en
      // cada petición (tenantMiddleware), así un cambio aplica sin esperar a que expire.
      const token = sign(
        { id: user.id, email: user.email, tenantId: user.tenantId },
        requireJwtSecret(),
        { expiresIn: "24h" },
      );

      return { user: await this.toSessionUser(user), token };
    });
  }

  private async toSessionUser(user: User): Promise<SessionUser> {
    const roles = await this.userRoleDao.findRolesOf(user.id);
    return {
      ...withoutPassword(user),
      roles,
      permissions: [...effectivePermissions(roles, user.isPlatformAdmin)],
    };
  }

  // owner ya tiene todos los permisos: combinarlo con otro rol no agrega nada.
  private normalizeRoles(roles: readonly UserRole[] | undefined): UserRole[] {
    const unique = [...new Set(roles ?? [])];
    if (unique.length === 0) throw new UserRoleRuleError("Elige al menos un rol");
    if (unique.includes("owner") && unique.length > 1) {
      throw new UserRoleRuleError("El dueño no se combina con otros roles");
    }
    return unique;
  }

  private async assertAnotherActiveOwner(userId: string): Promise<void> {
    if ((await this.userRoleDao.countActiveOwners(userId)) === 0) {
      throw new UserRoleRuleError("El taller necesita al menos un dueño activo");
    }
  }
}
