import { Store } from "lucide-react";
import { Loader } from "@ui/loader/loader";
import { PageMeta } from "../../../core/common/pages/page-meta";
import { useOnboardingBusiness } from "../hooks/use-onboarding-business";
import { BusinessInfoForm } from "../components/business-info-form";

export const OnboardingBusinessPage: React.FC = () => {
  const { form, loading, saving, error, onChange, onSubmit } = useOnboardingBusiness();

  return (
    <>
      <PageMeta
        title="Datos de tu taller"
        description="Cuéntanos sobre tu taller antes de elegir un plan"
      />
      <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Store className="size-6" />
            </span>
            <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Cuéntanos sobre tu taller
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Así aparecerá en tus notas, cotizaciones y tickets.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
              <BusinessInfoForm
                form={form}
                saving={saving}
                error={error}
                onChange={onChange}
                onSubmit={onSubmit}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
