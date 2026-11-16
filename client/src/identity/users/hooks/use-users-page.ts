import { useMemo, useState } from "react";
import type { UserRecord } from "./use-users";

export const useUsersPage = (users: UserRecord[]) => {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }, [search, users]);

  return { search, setSearch, filteredUsers };
};
