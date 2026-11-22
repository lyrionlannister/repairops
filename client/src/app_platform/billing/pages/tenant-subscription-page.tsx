import { useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useTenantSubscriptionPage } from "../hooks/use-tenant-subscription-page";
import { SubscriptionForm } from "../components/subscription-form";

export const TenantSubscriptionPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const page = useTenantSubscriptionPage(tenantId);

  return (
    <PageShell title="Plan del taller" description={page.tenantName ?? "Asigna plan, extras y estado."}>
      <div className="max-w-2xl">
        <SubscriptionForm
          form={page.form}
          plans={page.plans}
          disabled={page.disabled}
          onChange={page.setField}
          onSubmit={page.submit}
          onCancel={page.cancel}
        />
      </div>
    </PageShell>
  );
};
