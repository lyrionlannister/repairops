import { useEffect, type FC } from "react";
import { useEmployees } from "@identity/users/hooks/use-employees";
import { Select } from "./ui/select/select";
import { Input } from "./ui/inputs/input";
import { usePermissions } from "../hooks/use-permissions";
import { useCurrentUser } from "../hooks/use-current-user";
import type { EmployeeSelectProps } from "../props/employee-select-props";
import { selectableEmployees } from "../utils/selectable-employees";

// Reusable en cualquier modulo que necesite asignar un empleado por id
// (inventory, quotes, caja, dashboards) -- regla transversal: el valor
// siempre es el id del empleado elegido, nunca su nombre en texto libre.
export const EmployeeSelect: FC<EmployeeSelectProps> = ({
  value,
  onChange,
  placeholder = "Selecciona un empleado",
  disabled = false,
  className,
  roles,
}) => {
  const { employees, loading, fetchAll } = useEmployees();
  const { can } = usePermissions();
  const currentUser = useCurrentUser();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Sin staff.list (el técnico) no hay a quién elegir: la API asigna a quien crea.
  if (!can("staff.list")) {
    return (
      <Input
        name="assignedEmployee"
        value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ""}
        disabled
        className={className}
      />
    );
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      disabled={disabled || loading}
      placeholder={placeholder}
      className={className}
      options={selectableEmployees(employees, value, roles).map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}${e.isActive ? "" : " (inactivo)"}`,
      }))}
    />
  );
};

