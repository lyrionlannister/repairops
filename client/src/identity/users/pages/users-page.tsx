import { useEffect } from "react";
import { useNavigate } from "react-router";
import { UserPlus, Search } from "lucide-react";
import { useUsers } from "../hooks/use-users";
import { usePlan } from "../../../app_platform/billing/hooks/use-plan";
import { PlanUsageCard } from "../../../app_platform/billing/components/plan-usage-card";
import { useUsersPage } from "../hooks/use-users-page";
import { UsersTable } from "../components/users-table";
import { Input } from "@ui/inputs/input";
import { CheckboxField } from "@ui/checkbox/checkbox-field";
import { Button } from "@ui/button/button";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { PageShell } from "@common/components/page-shell/page-shell";

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading, error, fetchUsers, toggleUserStatus, togglingId } = useUsers();
  const { summary: planSummary, fetchPlan } = usePlan();
  const { search, setSearch, onlineOnly, setOnlineOnly, filteredUsers } = useUsersPage(users);

  useEffect(() => {
    fetchUsers();
    fetchPlan();
  }, [fetchUsers, fetchPlan]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredUsers);

  return (
    <PageShell
      title="Usuarios"
      description="Gestiona los usuarios del sistema."
      action={
        <Button
          variant="primary"
          startIcon={<UserPlus className="size-4" />}
          onClick={() => navigate("/identity/users/new")}
        >
          Nuevo usuario
        </Button>
      }
    >
      {planSummary && <PlanUsageCard summary={planSummary} />}

      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Buscar usuario"
            className="pl-9"
          />
        </div>
        <CheckboxField
          label="Solo conectados ahora"
          checked={onlineOnly}
          onChange={(checked) => {
            setOnlineOnly(checked);
            setPage(1);
          }}
        />
        </div>
      </div>

      <UsersTable
        loading={loading}
        error={error}
        pageItems={pageItems}
        togglingId={togglingId}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onRetry={fetchUsers}
        onCreate={() => navigate("/identity/users/new")}
        onEdit={(id) => navigate(`/identity/users/${id}/edit`)}
        onToggleStatus={(id) => toggleUserStatus(id).then(fetchPlan)}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </PageShell>
  );
};

