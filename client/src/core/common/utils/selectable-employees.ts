import type { EmployeeOption } from "@identity/users/types/employees";
import type { UserRole } from "../types/auth/permission";

// El valor ya elegido se conserva aunque hoy no califique (inactivo o con
// otro rol): si no, el formulario de una nota vieja perdería su técnico.
export const selectableEmployees = (
  employees: EmployeeOption[],
  selectedId: string,
  roles?: UserRole[],
): EmployeeOption[] =>
  employees.filter(
    (e) =>
      e.id === selectedId ||
      (e.isActive !== false && (!roles || e.roles.some((role) => roles.includes(role)))),
  );
