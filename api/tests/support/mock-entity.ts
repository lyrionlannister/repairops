// Los mocks de un test casi nunca necesitan el shape completo de una Entity
// (ver BaseEntity: id/publicId/fecha_creacion/etc no importan para la
// aserción). Este es el unico cast de todo el repo para ese caso -- unico
// lugar, nombre explicito de lo que hace, en vez de "as any" repartido en
// cada test.
export function mockEntity<T>(overrides: Partial<T>): T {
  return overrides as T;
}
