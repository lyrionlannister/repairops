import { singleton, inject } from "tsyringe";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { Repository } from "typeorm";
import { UserDao } from "../daos/user.dao.js";
import { UserRoleDao } from "../daos/user-role.dao.js";
import { RefreshTokenDao } from "../daos/refresh-token.dao.js";
import { TenantInvitationDao } from "../daos/tenant-invitation.dao.js";
import { EmailVerificationTokenDao } from "../daos/email-verification-token.dao.js";
import { sendVerificationEmail } from "../clients/resend.client.js";
import { AuditLogService, AUDIT_ACTIONS } from "../../../core/audit/services/audit-log.service.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { registrationMode, optionalEnv } from "../../../core/config/env.js";
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
import { StripePriceDao } from "../../../app_platform/billing/daos/stripe-price.dao.js";
import { SubscriptionDao } from "../../../app_platform/billing/daos/subscription.dao.js";
import type { SubscriptionStatus } from "../../../app_platform/billing/entities/subscription.entity.js";
import {
  effectivePermissions,
  roleCatalog,
  type Permission,
  type RoleCatalogEntry,
} from "../../authz/permissions.js";
import { toMoneyOrNull } from "../../../core/common/utils/money.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  EMAIL_VERIFICATION_TOKEN_MAX_AGE_MS,
} from "../constants/auth.constants.js";

const { sign } = jwt;

// Solo se guarda el hash SHA-256 de un token opaco (refresh o invitación):
// si la base se filtra, los tokens no sirven sin el valor en claro.
const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export class UserRoleRuleError extends Error {}

export type PublicUser = Omit<User, "password"> & { roles: UserRole[] };
export type SessionUser = PublicUser & {
  permissions: Permission[];
  subscriptionStatus: SubscriptionStatus;
};

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
    private stripePriceDao: StripePriceDao,
    private subscriptionDao: SubscriptionDao,
    private userRoleDao: UserRoleDao,
    private refreshTokenDao: RefreshTokenDao,
    private tenantInvitationDao: TenantInvitationDao,
    private emailVerificationTokenDao: EmailVerificationTokenDao,
    private auditLogService: AuditLogService,
  ) {}

  // Ya no pide plan en el registro: el owner entra directo (auto-login) a un
  // onboarding de cards (ver BillingService.selectPlan) que recién ahí crea
  // la Checkout Session de Stripe. Sin plan elegido todavía, el resto de la
  // app sigue bloqueada (status 'incomplete' -- ver AuthService.login).
  //
  // REGISTRATION_MODE (ver core/config/env.ts) decide quién puede registrar:
  // - `open` (default, autoservicio): cualquiera se registra solo; el
  //   abuso se controla con rate limiting, verificación de correo y captcha.
  // - `closed`: POST /register rechaza; el tenant lo crea el
  //   platform-admin (createTenantByAdmin) o una invitación (invite).
  // - `invite`: exige un token de invitación de un solo uso en el body.
  // - `open`: registro público como antes (solo para desarrollo).
  async register(data: RegisterUserDto & { invitationToken?: string }): Promise<{
    owner: SessionUser;
    token: string;
    refreshToken: string;
  }> {
    const mode = registrationMode();
    if (mode === "closed") {
      throw new BusinessError(
        "El registro está cerrado. Pide a un administrador de la plataforma que cree tu taller.",
        403,
      );
    }
    if (mode === "invite") {
      const token = data.invitationToken?.trim();
      if (!token) {
        throw new BusinessError("Se requiere un token de invitación para registrarse.", 403);
      }
      const invitation = await this.tenantInvitationDao.findByTokenHash(hashToken(token));
      if (
        !invitation ||
        invitation.usedAt !== null ||
        invitation.expiresAt.getTime() <= Date.now()
      ) {
        throw new BusinessError("Invitación inválida o expirada.", 403);
      }
    }
    const { owner, tenant } = await this.createTenantWithOwner(data, false, false);
    if (mode === "invite") {
      // Consumo atómico: si otro registro usó el mismo token a la vez, el
      // tenant ya se creó pero la invitación no se puede reutilizar -- el
      // caso es raro y se deja registrado en el log del servidor.
      const consumed = await this.tenantInvitationDao.consume(
        hashToken(data.invitationToken!.trim()),
      );
      if (!consumed) {
        console.error("[auth] La invitación ya había sido consumida:", data.email);
      }
    }
    const session = await this.issueSession(owner, tenant);
    try {
      await this.issueEmailVerification(owner);
    } catch (error) {
      // El registro ya terminó (tenant, owner y sesión existen); un fallo acá
      // (DB de tokens caída, etc.) no debe tirar abajo la respuesta -- el
      // owner puede pedir el correo de nuevo con POST /auth/resend-verification.
      console.error("[auth] No se pudo emitir la verificación de correo:", error);
    }
    // Sin esto, sessionStorage queda con un User a secas (sin roles/permisos/
    // subscriptionStatus) hasta que useAuthGuard lo refresque de forma
    // asíncrona -- el primer render de /home (justo al volver del Checkout de
    // Stripe) alcanza a pintar "Sin acceso" antes de que llegue ese refresh.
    const sessionOwner = await runWithTenant(tenant.id, () => this.toSessionUser(owner));
    return { owner: sessionOwner, token: session.accessToken, refreshToken: session.refreshToken };
  }

  // Creación de tenant por el platform-admin (modo `closed`): mismo alta
  // que el registro público pero sin auto-login -- el owner entra con sus
  // credenciales y sigue el onboarding de planes normal. Correo verificado
  // de entrada: un admin de la plataforma ya vouches por este alta.
  async createTenantByAdmin(data: RegisterUserDto): Promise<{ owner: PublicUser; tenant: Tenant }> {
    const { owner, tenant } = await this.createTenantWithOwner(data, false, true);
    const publicOwner = await runWithTenant(tenant.id, async () => ({
      ...withoutPassword(owner),
      roles: await this.userRoleDao.findRolesOf(owner.id),
    }));
    return { owner: publicOwner, tenant };
  }

  // Invitación de un solo uso (modo `invite`): el token en claro se devuelve
  // una sola vez; en base solo queda su hash.
  async createInvitation(input: {
    email?: string | null;
    expiresInDays?: number;
    createdByAdminId: string | null;
  }): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + (input.expiresInDays ?? 7) * 24 * 60 * 60 * 1000);
    await this.tenantInvitationDao.create({
      tokenHash: hashToken(token),
      email: input.email ?? null,
      expiresAt,
      usedAt: null,
      createdByAdminId: input.createdByAdminId,
    });
    return { token, expiresAt };
  }

  async listPendingInvitations(): Promise<
    Array<{ publicId: string; email: string | null; expiresAt: Date; createdAt: Date }>
  > {
    const invitations = await this.tenantInvitationDao.listPending();
    return invitations.map(({ publicId, email, expiresAt, createdAt }) => ({
      publicId,
      email,
      expiresAt,
      createdAt,
    }));
  }

  async registerPlatformAdmin(data: RegisterUserDto): Promise<User> {
    const { owner } = await this.createTenantWithOwner(data, true, true);
    return owner;
  }

  private async createTenantWithOwner(
    data: RegisterUserDto,
    isPlatformAdmin: boolean,
    autoVerifyEmail: boolean,
  ): Promise<{ owner: User; tenant: Tenant }> {
    // Sin tenant en contexto todavia, igual que login: el email solo se
    // puede checar sin ambiguedad en scope de sistema. Si esto corriera
    // despues de crear el Tenant, el check siempre pasaria en falso -- un
    // tenant recien creado nunca tiene usuarios, sin importar que el email
    // ya exista en otro.
    const existingUser = await allowSystemScope(() =>
      this.userDao.findByEmailAcrossTenants(data.email),
    );
    if (existingUser) {
      throw new BusinessError("Correo electrónico ya registrado");
    }

    const tenant = await allowSystemScope(() =>
      this.tenantRepository.save(this.tenantRepository.create({ name: `${data.firstName} ${data.lastName}`.trim() || data.email })),
    );

    // No esta envuelto en una transaccion de DB: si el insert del usuario
    // fallara, queda un Tenant huerfano sin dueno (basura inocua, no un
    // problema de integridad de datos como el de numero_control). La
    // suscripcion va antes que el dueno para que nunca exista un dueno sin plan.
    return runWithTenant(tenant.id, async () => {
      if (isPlatformAdmin) {
        await this.billingService.startSubscription("platform", "active");
      } else {
        const stripeCustomerId = await this.billingService.createCustomerForTenant({
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          tenantPublicId: tenant.publicId,
        });
        await this.billingService.startSubscriptionWithoutPlan(stripeCustomerId);
      }

      const hashedPassword = await hash(data.password, 10);

      const owner = await this.userDao.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        isPlatformAdmin,
        emailVerifiedAt: autoVerifyEmail ? new Date() : null,
      });
      await this.userRoleDao.replaceForUser(owner.id, ["owner"]);

      // Defaults del tenant nuevo -- una sola vez, aqui, no en cada arranque
      // del server (ver core/seed, retirado: ese barrido no escala con
      // muchos tenants y hacia esto mismo en cada boot).
      await this.serviceTypeService.seed();
      await this.branchService.seed({});

      return { owner, tenant };
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
      throw new BusinessError("Correo electrónico ya registrado");
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
        salaryAmount: toMoneyOrNull(data.salaryAmount),
        payCycle: data.payCycle ?? null,
      });
      await this.userRoleDao.replaceForUser(created.id, roles);
      await this.userBranchService.assign(created.id, assignment);
      return created;
    });

    await this.auditLogService.recordForCurrentActor({
      action: AUDIT_ACTIONS.AUTH_USER_CREATED,
      entity: "user",
      entityId: user.publicId,
      details: { email: user.email, roles },
    });
    return { ...withoutPassword(user), roles };
  }

  // A diferencia de createEmployee, password es opcional: solo se re-hashea
  // y reemplaza si llega no vacio, nunca se borra la contrasena actual por
  // dejar el campo en blanco en el form de edicion.
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<PublicUser | null> {
    const existingUser = await this.userDao.findByEmail(data.email);
    if (existingUser && existingUser.id !== id) {
      throw new BusinessError("Correo electrónico ya registrado");
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
      salaryAmount: toMoneyOrNull(data.salaryAmount),
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
    if (user && JSON.stringify([...currentRoles].sort()) !== JSON.stringify([...roles].sort())) {
      await this.auditLogService.recordForCurrentActor({
        action: AUDIT_ACTIONS.AUTH_ROLE_CHANGED,
        entity: "user",
        entityId: user.publicId,
        details: { email: user.email, previousRoles: currentRoles, newRoles: roles },
      });
    }
    return user ? { ...withoutPassword(user), roles } : null;
  }

  // Listado ligero para poblar los <Select> de empleado en otros modulos.
  async listEmployees(): Promise<
    Array<
      Pick<User, "id" | "publicId" | "firstName" | "lastName" | "isActive"> & { roles: UserRole[] }
    >
  > {
    const [users, roles] = await Promise.all([
      this.userDao.findAll(),
      this.userRoleDao.findAllOfTenant(),
    ]);
    return users.map(({ id, publicId, firstName, lastName, isActive }) => ({
      id,
      publicId,
      firstName,
      lastName,
      isActive,
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

  listRoles(): RoleCatalogEntry[] {
    return roleCatalog();
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
    await this.auditLogService.recordForCurrentActor({
      action: AUDIT_ACTIONS.AUTH_USER_STATUS_CHANGED,
      entity: "user",
      entityId: user.publicId,
      details: { email: user.email, isActive: user.isActive },
    });
    return { ...withoutPassword(user), roles: await this.userRoleDao.findRolesOf(id) };
  }

  async login(data: LoginUserDto): Promise<{
    user: SessionUser;
    token: string;
    refreshToken: string;
  }> {
    // findByEmail necesita tenant en contexto, pero en login todavia no se
    // sabe el tenant del usuario: se busca en scope de sistema por email
    // (unico campo sin ambiguedad antes de autenticar) y luego se re-entra
    // al tenant real para el resto de la operacion.
    //
    // Un solo mensaje genérico para los tres fallos (correo inexistente,
    // contraseña inválida, usuario inactivo): distinguirlos delata si el
    // correo existe. El motivo real queda en la bitácora, no en la respuesta.
    const user = await allowSystemScope(() => this.userDao.findByEmailAcrossTenants(data.email));
    if (!user) {
      await this.auditLogService.record({
        tenantId: null,
        actorEmail: data.email,
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        entity: "user",
        details: { reason: "email_not_found" },
      });
      throw new BusinessError("Correo o contraseña inválidos");
    }

    return runWithTenant(user.tenantId, async () => {
      const isPasswordValid = await compare(data.password, user.password);
      if (!isPasswordValid) {
        await this.auditLogService.record({
          tenantId: user.tenantId,
          userId: user.id,
          actorEmail: data.email,
          action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
          entity: "user",
          entityId: user.publicId,
          details: { reason: "wrong_password" },
        });
        throw new BusinessError("Correo o contraseña inválidos");
      }

      if (!user.isActive) {
        await this.auditLogService.record({
          tenantId: user.tenantId,
          userId: user.id,
          actorEmail: data.email,
          action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
          entity: "user",
          entityId: user.publicId,
          details: { reason: "inactive_user" },
        });
        throw new BusinessError("Correo o contraseña inválidos");
      }

      // Solo identidad: roles, permisos y el flag de plataforma se leen de la base en
      // cada petición (tenantMiddleware), así un cambio aplica sin esperar a que expire.
      const tenant = await this.tenantRepository.findOneByOrFail({ id: user.tenantId });

      // Sin bloquear login por 'incomplete': el owner necesita una sesión
      // real para llegar al onboarding de planes (o reanudar su Checkout
      // seleccionando el mismo plan otra vez -- ver BillingService.selectPlan,
      // que siempre genera una Checkout Session nueva). El client decide a
      // dónde navegar según subscriptionStatus.
      const sessionUser = await this.toSessionUser(user);
      const session = await this.issueSession(user, tenant);
      await this.auditLogService.record({
        tenantId: user.tenantId,
        userId: user.id,
        actorEmail: user.email,
        action: AUDIT_ACTIONS.AUTH_LOGIN,
        entity: "user",
        entityId: user.publicId,
      });
      return { user: sessionUser, token: session.accessToken, refreshToken: session.refreshToken };
    });
  }

  // Renueva la sesión con un refresh token: rota (el viejo queda revocado y
  // apunta al nuevo) y devuelve un par nuevo. Reutilizar un token ya rotado
  // es robo: se revoca toda la familia de tokens del usuario.
  async refreshSession(
    refreshToken: string,
  ): Promise<{ user: SessionUser; token: string; refreshToken: string }> {
    const row = await this.refreshTokenDao.findByTokenHash(hashToken(refreshToken));
    if (!row || row.revokedAt !== null || row.expiresAt.getTime() <= Date.now()) {
      if (row && row.revokedAt !== null && row.replacedByTokenHash !== null) {
        await this.refreshTokenDao.revokeAllForUser(row.userId, row.tenantId);
      }
      throw new BusinessError("Sesión expirada");
    }

    return runWithTenant(row.tenantId, async () => {
      const user = await this.userDao.findById(row.userId);
      if (!user || !user.isActive) {
        await this.refreshTokenDao.revokeAllForUser(row.userId, row.tenantId);
        throw new BusinessError("Sesión expirada");
      }
      const tenant = await this.tenantRepository.findOneByOrFail({ id: row.tenantId });
      const session = await this.issueSession(user, tenant, row);
      return {
        user: await this.toSessionUser(user),
        token: session.accessToken,
        refreshToken: session.refreshToken,
      };
    });
  }

  // Cierra la sesión: revoca el refresh token si llega uno válido. El access
  // token (15 min) expira solo; sin refresh válido no se puede renovar.
  async revokeSession(refreshToken?: string | null): Promise<void> {
    if (!refreshToken) return;
    const row = await this.refreshTokenDao.findByTokenHash(hashToken(refreshToken));
    if (row && row.revokedAt === null) {
      await this.refreshTokenDao.update(row.id, { revokedAt: new Date() });
    }
  }

  // Consume el código de verificación (sin sesión necesaria: el usuario
  // puede tipearlo o pegar el link con ?code= desde otro dispositivo/
  // navegador). Igual forma que refreshSession: se resuelve el tenant desde
  // la fila del token, no del JWT.
  async verifyEmail(code: string): Promise<SessionUser> {
    const row = await this.emailVerificationTokenDao.findByTokenHash(hashToken(code));
    if (!row || row.consumedAt !== null || row.expiresAt.getTime() <= Date.now()) {
      throw new BusinessError("El código de verificación es inválido o expiró.");
    }

    return runWithTenant(row.tenantId, async () => {
      const consumed = await this.emailVerificationTokenDao.consume(hashToken(code));
      if (!consumed) {
        throw new BusinessError("El código de verificación ya fue usado.");
      }
      const updated = await this.userDao.update(row.userId, { emailVerifiedAt: new Date() });
      if (!updated) {
        throw new BusinessError("Usuario no encontrado.");
      }
      await this.auditLogService.record({
        tenantId: row.tenantId,
        userId: row.userId,
        actorEmail: updated.email,
        action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFIED,
        entity: "user",
        entityId: updated.publicId,
      });
      return this.toSessionUser(updated);
    });
  }

  // A diferencia de issueEmailVerification en register() (best-effort), acá
  // un fallo sí debe llegar al usuario: pidió el reenvío a propósito, así que
  // si no se pudo mandar, el botón debe decir que falló, no fingir éxito.
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new BusinessError("Usuario no encontrado.");
    }
    if (user.emailVerifiedAt) {
      throw new BusinessError("Tu correo ya está verificado.");
    }
    await this.emailVerificationTokenDao.invalidatePendingForUser(user.id, user.tenantId);
    await this.issueEmailVerification(user);
    await this.auditLogService.recordForCurrentActor({
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_RESENT,
      entity: "user",
      entityId: user.publicId,
      details: { email: user.email },
    });
  }

  // Genera el token (hash en DB, claro solo en el link), lo guarda y manda el
  // correo. sendVerificationEmail no lanza por un error del lado de Resend
  // (ver resend.client.ts) -- solo una falla de DB al guardar el token
  // propaga, y la decisión de qué hacer con eso es de quien llama.
  private async issueEmailVerification(user: User): Promise<void> {
    // Código numérico (no un link de 256 bits): el owner puede confirmar
    // desde el botón del correo (precarga el código) o tipeándolo a mano
    // si abre el correo en otro dispositivo/navegador sin la sesión del
    // registro. Por la baja entropía (1 en un millón), verifyEmail() va
    // detrás de un rate limit por IP (ver routes/auth.routes.ts).
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.emailVerificationTokenDao.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: hashToken(code),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_MAX_AGE_MS),
      consumedAt: null,
    });
    const verifyUrl = `${optionalEnv("CLIENT_URL", "http://localhost:5173")}/identity/verify-email?code=${code}`;
    await sendVerificationEmail({ to: user.email, firstName: user.firstName, code, verifyUrl });
  }

  // Emite un par access (15 min) + refresh (7 días). Si llega `previous`,
  // lo revoca y lo apunta al nuevo (rotación).
  private async issueSession(
    user: User,
    tenant: Tenant,
    previous?: { id: string; tokenHash: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = randomBytes(32).toString("hex");
    const refreshTokenHash = hashToken(refreshToken);
    await this.refreshTokenDao.create({
      tenantId: tenant.id,
      userId: user.id,
      tokenHash: refreshTokenHash,
      replacedByTokenHash: null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
      revokedAt: null,
    });
    if (previous) {
      await this.refreshTokenDao.update(previous.id, {
        revokedAt: new Date(),
        replacedByTokenHash: refreshTokenHash,
      });
    }
    return { accessToken: this.signToken(user, tenant), refreshToken };
  }

  private signToken(user: User, tenant: Tenant): string {
    return sign(
      { id: user.publicId, email: user.email, tenantId: tenant.publicId },
      requireJwtSecret(),
      { expiresIn: "15m" },
    );
  }

  private async toSessionUser(user: User): Promise<SessionUser> {
    const [roles, subscription] = await Promise.all([
      this.userRoleDao.findRolesOf(user.id),
      this.subscriptionDao.findCurrent(),
    ]);
    return {
      ...withoutPassword(user),
      roles,
      permissions: [...effectivePermissions(roles, user.isPlatformAdmin)],
      subscriptionStatus: subscription?.status ?? "active",
    };
  }

  // owner ya tiene todos los permisos: combinarlo con otro rol no agrega nada.
  private normalizeRoles(roles: readonly UserRole[] | undefined): UserRole[] {
    const unique = [...new Set(roles ?? [])];
    if (unique.length === 0) throw new UserRoleRuleError("Elige al menos un rol");
    if (unique.includes("owner") && unique.length > 1) {
      throw new UserRoleRuleError("El administrador no se combina con otros roles");
    }
    return unique;
  }

  private async assertAnotherActiveOwner(userId: string): Promise<void> {
    if ((await this.userRoleDao.countActiveOwners(userId)) === 0) {
      throw new UserRoleRuleError("El taller necesita al menos un administrador activo");
    }
  }
}
