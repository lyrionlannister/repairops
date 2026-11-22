import type { BranchRecord } from "@common/types/branch-context";
import { ROLE_LABELS } from "../hooks/use-users";
import type { UserFormData } from "../types/users";
import type { UserSummary } from "../types/user-summary";

export const buildUserSummary = (
  form: UserFormData,
  branches: readonly BranchRecord[],
): UserSummary => ({
  fullName: `${form.firstName} ${form.lastName}`.trim(),
  email: form.email.trim(),
  roleLabels: form.roles.map((role) => ROLE_LABELS[role]),
  allBranches: form.roles.includes("owner"),
  branches: branches
    .filter((branch) => form.branchIds.includes(branch.id))
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      primary: branch.id === form.primaryBranchId,
    })),
});
