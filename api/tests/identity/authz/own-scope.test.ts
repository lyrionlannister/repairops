import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Repository } from "typeorm";
import AppDataSource from "../../../src/core/config/data-source.js";
import { runWithTenant, type RequestActor } from "../../../src/core/tenancy/tenant-context.js";
import { effectivePermissions } from "../../../src/identity/authz/permissions.js";
import type { UserRole } from "../../../src/identity/auth/entities/user.entity.js";
import { RepairNote } from "../../../src/commerce/repair-notes/entities/repair-note.entity.js";
import { RepairNoteDao } from "../../../src/commerce/repair-notes/daos/repair-note.dao.js";
import { Customer } from "../../../src/commerce/customers/entities/customer.entity.js";
import { CustomerDao } from "../../../src/commerce/customers/daos/customer.dao.js";
import { Quote } from "../../../src/commerce/quotes/entities/quote.entity.js";
import { QuoteDao } from "../../../src/commerce/quotes/daos/quote.dao.js";
import { ChatMessage } from "../../../src/messaging/chats/entities/chat-message.entity.js";
import { ChatMessageDao } from "../../../src/messaging/chats/daos/chat-message.dao.js";
import { ChatStatsDao } from "../../../src/messaging/chats/daos/chat-stats.dao.js";
import { ChatsService } from "../../../src/messaging/chats/services/chats.service.js";
import { ContactName } from "../../../src/messaging/chats/entities/contact-name.entity.js";
import { generatePublicRef } from "../../../src/commerce/repair-notes/utils/public-ref.js";
import { setupStaff } from "../../support/staff.js";

// Integración contra Postgres real: el técnico (permisos .own) solo ve lo ligado a sus
// notas asignadas; recepción (permiso completo) ve todo. Otro taller nunca aparece.
describe("permisos .own del técnico", () => {
  const tenantId = `${Date.now()}41`;
  const otherTenantId = `${Date.now()}42`;
  let technicianId = "";
  let otherTechnicianId = "";
  let ids: {
    ownNote: string;
    foreignNote: string;
    ownCustomer: string;
    foreignCustomer: string;
    ownQuote: string;
    foreignQuote: string;
  };
  let noteDao: RepairNoteDao;
  let customerDao: CustomerDao;
  let quoteDao: QuoteDao;
  let chats: ChatsService;

  const actor = (userId: string, roles: UserRole[]): RequestActor => ({
    userId,
    roles,
    permissions: effectivePermissions(roles, false),
  });
  const asTechnician = <T>(fn: () => Promise<T>) =>
    runWithTenant(tenantId, fn, null, actor(technicianId, ["technician"]));
  const asFrontDesk = <T>(fn: () => Promise<T>) =>
    runWithTenant(tenantId, fn, null, actor(otherTechnicianId, ["employee"]));

  async function insertNote(
    tid: string,
    branchId: string,
    control: number,
    customerId: string,
    assignedTo: string | null,
  ) {
    const [{ id }] = await AppDataSource.query(
      `INSERT INTO repair_notes (tenant_id, local_id, numero_control, public_ref, nombre_cliente, marca, modelo,
         falla_reportada, fecha_recepcion, hora_recepcion, customer_id, id_empleado_asignado)
       VALUES ($1, $2, $3, $4, 'Cliente', 'Marca', 'Modelo', 'Falla', '2026-01-01', '10:00', $5, $6) RETURNING id::text AS id`,
      [tid, branchId, control, generatePublicRef(), customerId, assignedTo],
    );
    return id as string;
  }

  async function insertCustomer(tid: string, phone: string) {
    const [{ id }] = await AppDataSource.query(
      `INSERT INTO customers (tenant_id, nombre, telefono) VALUES ($1, 'Cliente', $2) RETURNING id::text AS id`,
      [tid, phone],
    );
    return id as string;
  }

  async function insertQuote(tid: string, branchId: string, noteId: string | null) {
    const [{ id }] = await AppDataSource.query(
      `INSERT INTO quotes (tenant_id, local_id, nombre_cliente, id_nota_reparacion) VALUES ($1, $2, 'Cliente', $3) RETURNING id::text AS id`,
      [tid, branchId, noteId],
    );
    return id as string;
  }

  beforeAll(async () => {
    await AppDataSource.initialize();
    const staff = await setupStaff(AppDataSource, tenantId, ["owner", "technician", "employee"]);
    technicianId = staff.userIds["technician"] as string;
    otherTechnicianId = staff.userIds["employee"] as string;
    const other = await setupStaff(AppDataSource, otherTenantId, ["owner"]);

    const ownCustomer = await insertCustomer(tenantId, "5215550000001");
    const foreignCustomer = await insertCustomer(tenantId, "5215550000002");
    const ownNote = await insertNote(tenantId, staff.branchId, 1, ownCustomer, technicianId);
    const foreignNote = await insertNote(
      tenantId,
      staff.branchId,
      2,
      foreignCustomer,
      otherTechnicianId,
    );
    ids = {
      ownNote,
      foreignNote,
      ownCustomer,
      foreignCustomer,
      ownQuote: await insertQuote(tenantId, staff.branchId, ownNote),
      foreignQuote: await insertQuote(tenantId, staff.branchId, foreignNote),
    };
    await insertNote(
      otherTenantId,
      other.branchId,
      1,
      await insertCustomer(otherTenantId, "5215550000003"),
      technicianId,
    );

    // La conversación del 0001 referencia la nota propia; la del 0002 empezó con la propia
    // y después el cliente escaneó la ajena: pasa al técnico de la ajena.
    for (const [phone, noteId] of [
      ["5215550000001", ownNote],
      ["5215550000002", ownNote],
      ["5215550000002", foreignNote],
    ]) {
      await AppDataSource.query(
        `INSERT INTO chat_messages (tenant_id, contact_phone, direction, sender, body, repair_note_id)
         VALUES ($1, $2, 'inbound', 'customer', 'hola', $3)`,
        [tenantId, phone, noteId],
      );
    }

    noteDao = new RepairNoteDao(AppDataSource.getRepository(RepairNote));
    customerDao = new CustomerDao(AppDataSource.getRepository(Customer));
    quoteDao = new QuoteDao(AppDataSource.getRepository(Quote));
    const chatMessageDao = new ChatMessageDao(AppDataSource.getRepository(ChatMessage));
    chats = new ChatsService(
      chatMessageDao,
      {} as ChatStatsDao,
      AppDataSource.getRepository(ContactName) as Repository<ContactName>,
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("notas: el técnico lista y abre solo las suyas", async () => {
    expect((await asTechnician(() => noteDao.findAll())).map((n) => n.id)).toEqual([ids.ownNote]);
    expect(await asTechnician(() => noteDao.findById(ids.foreignNote))).toBeNull();
    expect(await asTechnician(() => noteDao.findById(ids.ownNote))).not.toBeNull();
    expect((await asFrontDesk(() => noteDao.findAll())).map((n) => n.id).sort()).toEqual(
      [ids.ownNote, ids.foreignNote].sort(),
    );
  });

  it("clientes: el técnico solo ve los de sus notas", async () => {
    expect((await asTechnician(() => customerDao.findAll())).map((c) => c.id)).toEqual([
      ids.ownCustomer,
    ]);
    expect(await asTechnician(() => customerDao.findById(ids.foreignCustomer))).toBeNull();
    expect((await asFrontDesk(() => customerDao.findAll())).length).toBe(2);
  });

  it("cotizaciones: el técnico solo ve y edita las ligadas a sus notas", async () => {
    expect((await asTechnician(() => quoteDao.findAllOrdered())).map((q) => q.id)).toEqual([
      ids.ownQuote,
    ]);
    expect(await asTechnician(() => quoteDao.findById(ids.foreignQuote))).toBeNull();
    expect(
      await asTechnician(() =>
        quoteDao.update(ids.foreignQuote, { customerName: "X" } as Partial<Quote>),
      ),
    ).toBeNull();
    expect(await asTechnician(() => quoteDao.delete(ids.foreignQuote))).toBe(false);
  });

  it("conversaciones: la nota más reciente referenciada decide de quién es", async () => {
    expect(await asTechnician(() => chats.canAccess("5215550000001", "reply"))).toBe(true);
    expect(await asTechnician(() => chats.canAccess("5215550000002", "read"))).toBe(false);
    expect((await asTechnician(() => chats.getConversations())).map((c) => c.sessionId)).toEqual([
      "5215550000001",
    ]);
    expect(await asFrontDesk(() => chats.canAccess("5215550000002", "reply"))).toBe(true);
  });

  it("sin actor (jobs, webhooks) no se filtra", async () => {
    const all = await runWithTenant(tenantId, () => noteDao.findAll());
    expect(all.map((n) => n.id).sort()).toEqual([ids.ownNote, ids.foreignNote].sort());
  });
});
