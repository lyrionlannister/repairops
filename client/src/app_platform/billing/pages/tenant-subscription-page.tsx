import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import {
  tenantToForm,
  usePlatformTenants,
  type SubscriptionFormData,
} from "../hooks/use-platform-tenants";
import { SubscriptionForm } from "../components/subscription-form";

const EMPTY_FORM: SubscriptionFormData = {
  planKey: "basico",
  extraUsers: "0",
  extraBranches: "0",
  status: "trialing",
};

export const TenantSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { tenants, plans, loading, saving, error, fetchAll, assign } = usePlatformTenants();
  const [form, setForm] = useState<SubscriptionFormData>(EMPTY_FORM);
  const tenant = tenants.find((t) => t.tenantId === tenantId);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (tenant) setForm(tenantToForm(tenant));
  }, [tenant]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (tenantId && (await assign(tenantId, form))) navigate("/platform/tenants");
  };

  return (
    <PageShell
      title="Plan del taller"
      description={tenant ? tenant.tenantName : "Asigna plan, extras y estado."}
    >
      <div className="max-w-2xl">
        <SubscriptionForm
          form={form}
          plans={plans}
          disabled={loading || saving || !tenant}
          error={error}
          onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/platform/tenants")}
        />
      </div>
    </PageShell>
  );
};
