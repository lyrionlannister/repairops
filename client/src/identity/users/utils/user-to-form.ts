import type { UserFormData, UserRecord } from "../hooks/use-users";

// password nunca viaja de vuelta del backend: siempre arranca vacía al editar.
export const userToForm = (user: UserRecord): UserFormData => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  password: "",
  role: user.role,
  salaryAmount: user.salaryAmount != null ? String(user.salaryAmount) : "",
  payCycle: user.payCycle ?? "",
  branchIds: user.branchIds ?? [],
  primaryBranchId: user.primaryBranchId ?? "",
});
