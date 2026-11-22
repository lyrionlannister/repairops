import { describe, expect, it } from "vitest";
import {
  effectivePermissions,
  PLATFORM_PERMISSIONS,
  ROLE_PERMISSIONS,
  TENANT_PERMISSIONS,
} from "../../../src/identity/authz/permissions.js";

describe("mapa de permisos", () => {
  it("el dueño tiene todos los permisos del taller y ninguno de plataforma", () => {
    const owner = effectivePermissions(["owner"], false);
    expect([...owner].sort()).toEqual([...TENANT_PERMISSIONS].sort());
    PLATFORM_PERMISSIONS.forEach((permission) => expect(owner.has(permission)).toBe(false));
  });

  it("varios roles suman: cajero + técnico cobra y además trabaja sus notas", () => {
    const both = effectivePermissions(["cashier", "technician"], false);
    expect(both.has("cash.operate")).toBe(true);
    expect(both.has("repair-notes.write.own")).toBe(true);
    expect(both.size).toBe(
      new Set([...ROLE_PERMISSIONS.cashier, ...ROLE_PERMISSIONS.technician]).size,
    );
  });

  it("el flag de plataforma agrega platform.* sin abrir nada del taller", () => {
    const admin = effectivePermissions([], true);
    expect([...admin].sort()).toEqual([...PLATFORM_PERMISSIONS].sort());
  });

  it("el técnico no ve caja, ventas, dashboard ni la lista de personal", () => {
    const technician = effectivePermissions(["technician"], false);
    for (const permission of [
      "cash.read",
      "sales.read",
      "dashboard.read",
      "staff.list",
      "customers.read",
      "inventory.read",
    ] as const) {
      expect(technician.has(permission)).toBe(false);
    }
  });

  it("solo el dueño autoriza diferencias de caja, ve montos e inventaría", () => {
    for (const role of ["cashier", "technician", "employee"] as const) {
      const permissions = effectivePermissions([role], false);
      expect(permissions.has("cash.authorize-variance")).toBe(false);
      expect(permissions.has("dashboard.money")).toBe(false);
      expect(permissions.has("inventory.count")).toBe(false);
    }
  });

  it("cada permiso de un rol existe en el catálogo", () => {
    const catalog = new Set<string>(TENANT_PERMISSIONS);
    Object.values(ROLE_PERMISSIONS)
      .flat()
      .forEach((permission) => expect(catalog.has(permission)).toBe(true));
  });
});
