import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import { useBranches, type BranchFormData } from "./use-branches";

const EMPTY_FORM: BranchFormData = { name: "", address: "", phone: "" };

export const useBranchFormPage = (id: string | undefined) => {
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { branches, loading, saving, fetchAll, create, update } = useBranches();
  const { refreshBranches } = useBranch();
  const [form, setForm] = useState<BranchFormData>(EMPTY_FORM);
  const editingBranch = id ? branches.find((b) => b.id === id) : undefined;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (editingBranch) {
      setForm({ name: editingBranch.name, address: editingBranch.address ?? "", phone: editingBranch.phone ?? "" });
    }
  }, [editingBranch]);

  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = isEdit && id ? await update(id, form) : await create(form);
    if (ok) {
      await refreshBranches();
      navigate("/identity/branches");
    }
  };

  return { isEdit, form, loading, saving, change, submit, cancel: () => navigate("/identity/branches") };
};
