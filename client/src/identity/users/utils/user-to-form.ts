import type { UserFormData, UserRecord } from "../types/users";
// password nunca viaja de vuelta del backend: siempre arranca vacía al editar.
export const userToForm = (user: UserRecord): UserFormData => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  password: "",
  roles: user.roles,
  salaryAmount: user.salaryAmount != null ? String(user.salaryAmount) : "",
  payCycle: user.payCycle ?? "",
  branchIds: user.branchIds ?? [],
  primaryBranchId: user.primaryBranchId ?? "",
});

// El owner accede a todas las sucursales: nunca se le asignan branchIds/primaryBranchId.
export const formToPayload = (form: UserFormData) => ({
  firstName: form.firstName,
  lastName: form.lastName,
  email: form.email,
  roles: form.roles,
  salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : undefined,
  payCycle: form.payCycle || undefined,
  ...(form.roles.includes("owner")
    ? {}
    : { branchIds: form.branchIds, primaryBranchId: form.primaryBranchId || undefined }),
});
