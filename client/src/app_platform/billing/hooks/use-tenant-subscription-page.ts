import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePlatformTenants } from "./use-platform-tenants";
import { tenantToForm } from "../utils/format";
import type { SubscriptionFormData } from "../types/platform-tenants";

const EMPTY_FORM: SubscriptionFormData = { planKey: "basico", extraUsers: "0", extraBranches: "0", status: "trialing" };

export const useTenantSubscriptionPage = (tenantId: string | undefined) => {
  const navigate = useNavigate();
  const { tenants, plans, loading, saving, fetchAll, assign } = usePlatformTenants();
  const [form, setForm] = useState<SubscriptionFormData>(EMPTY_FORM);
  const tenant = tenants.find((t) => t.tenantId === tenantId);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (tenant) setForm(tenantToForm(tenant));
  }, [tenant]);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (tenantId && (await assign(tenantId, form))) navigate("/platform/tenants");
  };

  return {
    tenantName: tenant?.tenantName ?? null,
    form,
    plans,
    disabled: loading || saving || !tenant,
    setField: (field: keyof SubscriptionFormData, value: string) => setForm((prev) => ({ ...prev, [field]: value })),
    submit,
    cancel: () => navigate("/platform/tenants"),
  };
};
