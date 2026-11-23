import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useLocal } from "@app-platform/local/hooks/use-local";
import type { BusinessInfoForm } from "../types/onboarding-business";

const EMPTY_FORM: BusinessInfoForm = { name: "", address: "", phone: "" };

export const useOnboardingBusiness = () => {
  const navigate = useNavigate();
  const { local, loading, saving, error, fetchLocal, updateLocal } = useLocal();
  const [form, setForm] = useState<BusinessInfoForm>(EMPTY_FORM);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  useEffect(() => {
    if (!local) return;
    // Nombre ya puesto (paso completado antes, p.ej. checkout abandonado):
    // salta directo al paso de plan en vez de mostrar el form otra vez.
    if (local.name) {
      navigate("/identity/onboarding/plan", { replace: true });
      return;
    }
    setForm({ name: local.name ?? "", address: local.address ?? "", phone: local.phone ?? "" });
    setChecked(true);
  }, [local, navigate]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await updateLocal(form);
    if (ok) navigate("/identity/onboarding/plan", { replace: true });
  };

  return { form, loading: loading || !checked, saving, error, onChange, onSubmit };
};
