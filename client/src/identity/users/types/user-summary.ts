export interface UserSummaryBranch {
  id: string;
  name: string;
  primary: boolean;
}

export interface UserSummary {
  fullName: string;
  email: string;
  roleLabels: string[];
  allBranches: boolean;
  branches: UserSummaryBranch[];
}
