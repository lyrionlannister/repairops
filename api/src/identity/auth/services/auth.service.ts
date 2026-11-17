import { singleton, inject } from "tsyringe";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { Repository } from "typeorm";
import { UserDao } from "../daos/user.dao.js";
import { RegisterUserDto } from "../dtos/register-user.dto.js";
import { LoginUserDto } from "../dtos/login-user.dto.js";
import { CreateEmployeeDto } from "../dtos/create-employee.dto.js";
import { UpdateEmployeeDto } from "../dtos/update-employee.dto.js";
import { User } from "../entities/user.entity.js";
import { Tenant } from "../../../core/tenancy/entities/tenant.entity.js";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { requireJwtSecret } from "../jwt-secret.js";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { ServiceTypeService } from "../../../commerce/service-types/services/service-type.service.js";
import { BranchService } from "../../branches/services/branch.service.js";
import { UserBranchService, type BranchAssignment } from "../../branches/services/user-branch.service.js";

const { sign } = jwt;

@singleton()
export class AuthService {
  constructor(
    private userDao: UserDao,
    @inject(repositoryToken(Tenant)) private tenantRepository: Repository<Tenant>,
    private serviceTypeService: ServiceTypeService,
    private branchService: BranchService,
    private userBranchService: UserBranchService,
  ) {}

  async register(data: RegisterUserDto): Promise<User> {
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

    // crear el Tenant corre en scope de sistema, explicito.
    const tenant = await allowSystemScope(() =>
      this.tenantRepository.save(this.tenantRepository.create({ name: data.email })),
    );

    // No esta envuelto en una transaccion de DB: si el insert del usuario
    // fallara, queda un Tenant huerfano sin dueno (basura inocua, no un
    // problema de integridad de datos como el de numero_control).
    return runWithTenant(tenant.id, async () => {
      const hashedPassword = await hash(data.password, 10);

      const owner = await this.userDao.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: "owner",
      });

      // Defaults del tenant nuevo -- una sola vez, aqui, no en cada arranque
      // del server (ver core/seed, retirado: ese barrido no escala con
      // muchos tenants y hacia esto mismo en cada boot).
      await this.serviceTypeService.seed();
      await this.branchService.seed({});

      return owner;
    });
  }

  // Cada usuario sale con sus sucursales (branchIds y la principal); el owner no tiene filas.
  async getAllUsers(): Promise<Array<Omit<User, "password"> & BranchAssignment>> {
    const [users, assignments] = await Promise.all([this.userDao.findAll(), this.userBranchService.getAssignments()]);
    return users.map(({ password, ...rest }) => ({
      ...rest,
      ...(assignments.get(String(rest.id)) ?? { branchIds: [], primaryBranchId: null }),
    }));
  }

  // Empleado nuevo dentro del tenant ya resuelto por tenantMiddleware -- a
  // diferencia de register(), nunca crea un Tenant.
  async createEmployee(data: CreateEmployeeDto): Promise<Omit<User, "password">> {
    const existingUser = await this.userDao.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email ya registrado");
    }

    // Las sucursales se validan antes de crear nada: un usuario sin sucursal no puede operar.
    const role = data.role ?? "employee";
    const assignment = await this.userBranchService.normalize(role, data.branchIds, data.primaryBranchId);

    const hashedPassword = await hash(data.password, 10);

    const user = await this.userDao.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      role,
      salaryAmount: data.salaryAmount ?? null,
      payCycle: data.payCycle ?? null,
    });
    await this.userBranchService.assign(user.id, assignment);

    const { password, ...rest } = user;
    return rest;
  }

  // A diferencia de createEmployee, password es opcional: solo se re-hashea
  // y reemplaza si llega no vacio, nunca se borra la contrasena actual por
  // dejar el campo en blanco en el form de edicion.
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Omit<User, "password"> | null> {
    const existingUser = await this.userDao.findByEmail(data.email);
    if (existingUser && existingUser.id !== id) {
      throw new Error("Email ya registrado");
    }

    // Sin branchIds se conservan las actuales; si el usuario deja de ser owner debe tener sucursales.
    const role = data.role ?? "employee";
    const current = (await this.userBranchService.getAssignments()).get(String(id));
    const assignment = await this.userBranchService.normalize(
      role,
      data.branchIds ?? current?.branchIds,
      data.primaryBranchId ?? (data.branchIds ? undefined : (current?.primaryBranchId ?? undefined)),
    );

    const updatePayload: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role ?? "employee",
      salaryAmount: data.salaryAmount ?? null,
      payCycle: data.payCycle ?? null,
    };
    if (data.password) {
      updatePayload.password = await hash(data.password, 10);
    }

    const user = await this.userDao.update(id, updatePayload);
    if (!user) return null;
    await this.userBranchService.assign(user.id, assignment);
    const { password, ...rest } = user;
    return rest;
  }

  // Listado ligero para poblar los <Select> de empleado en otros modulos.
  async listEmployees(): Promise<Pick<User, "id" | "firstName" | "lastName" | "role">[]> {
    const users = await this.userDao.findAll();
    return users.map(({ id, firstName, lastName, role }) => ({ id, firstName, lastName, role }));
  }

  // Resolver nombre de un empleado puntual (p.ej. para el PDF de una nota).
  async getEmployeeName(id: string): Promise<string | null> {
    const user = await this.userDao.findById(id);
    return user ? `${user.firstName} ${user.lastName}`.trim() : null;
  }

  // Perfil del propio usuario autenticado -- a diferencia del JWT (que trae
  // el estado al momento del login), esto siempre lee la fila actual, asi
  // que recoge cambios de rol/nombre hechos por un admin despues de que el
  // usuario inicio sesion.
  async getMe(id: string): Promise<Omit<User, "password"> | null> {
    const user = await this.userDao.findById(id);
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  async toggleUserStatus(id: string): Promise<Omit<User, "password"> | null> {
    const user = await this.userDao.toggleStatus(id);
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  async login(
    data: LoginUserDto,
  ): Promise<{ user: Omit<User, "password">; token: string }> {
    // findByEmail necesita tenant en contexto, pero en login todavia no se
    // sabe el tenant del usuario: se busca en scope de sistema por email
    // (unico campo sin ambiguedad antes de autenticar) y luego se re-entra
    // al tenant real para el resto de la operacion.
    const user = await allowSystemScope(() =>
      this.userDao.findByEmailAcrossTenants(data.email),
    );
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

      const token = sign(
        {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
          isPlatformAdmin: user.isPlatformAdmin,
        },
        requireJwtSecret(),
        { expiresIn: "24h" },
      );

      const { password, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, token };
    });
  }
}
