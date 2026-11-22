import { ROLE_LABELS, type UserRole } from "../hooks/use-users";

export const formatRoles = (roles: readonly UserRole[]): string => roles.map((role) => ROLE_LABELS[role]).join(", ");

// Mismas reglas que la API: el dueño ya tiene todo y no se combina con otro rol.
export const toggleRole = (roles: readonly UserRole[], role: UserRole, checked: boolean): UserRole[] => {
  if (!checked) return roles.filter((current) => current !== role);
  if (role === "owner") return ["owner"];
  return [...roles.filter((current) => current !== "owner" && current !== role), role];
};
