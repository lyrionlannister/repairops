import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { useImportStaging } from "../hooks/use-import-staging";
import { useToast } from "@common/hooks/use-toast";
import { PageShell } from "@common/components/page-shell/page-shell";
import { ImportSelectStep } from "../components/import-select-step";
import { ImportProcessingStep } from "../components/import-processing-step";
import { ImportPreviewStep } from "../components/import-preview-step";
import type { StagingProgress, StagingRow } from "../types/import-staging";
import type { Step } from "../types/import-price-list-page";

export const ImportPriceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { suppliers, loading: loadingSuppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const { uploading, saving, upload, subscribeToImport, updateRows, commit, discard } =
    useImportStaging();

  const [step, setStep] = useState<Step>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [rows, setRows] = useState<StagingRow[]>([]);
  const [progress, setProgress] = useState<StagingProgress | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

  useEffect(() => {
    if (step !== "processing" || !importId) return;
    const unsubscribe = subscribeToImport(importId, (event) => {
      if (event.status === "ready") {
        setRows(event.rows);
        setStep("preview");
        unsubscribe();
      } else if (event.status === "error") {
        showToast({
          title: "No se pudo procesar el archivo",
          message: event.error ?? "La IA no pudo procesar el archivo",
          variant: "error",
        });
        setStep("select");
        unsubscribe();
      } else {
        setProgress(event.progress);
      }
    });
    return unsubscribe;
  }, [step, importId, subscribeToImport, showToast]);

  const handleFile = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !supplierId) return;
    setProgress(undefined);
    const newImportId = await upload(selectedFile, supplierId);
    if (!newImportId) return;
    setImportId(newImportId);
    setStep("processing");
  };

  const updateRow = (index: number, patch: Partial<StagingRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { brand: "", model: "", price: 0 }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleConfirm = async () => {
    if (!importId) return;
    const ok = await updateRows(importId, rows);
    if (!ok) return;
    const result = await commit(importId);
    if (!result) return;
    navigate("/commerce/price-list", { state: { imported: result.imported } });
  };

  const handleDiscard = async () => {
    if (importId) await discard(importId);
    setImportId(null);
    setRows([]);
    setSelectedFile(null);
    setStep("select");
  };

  return (
    <PageShell
      title="Importar lista de precios"
      description="Sube un PDF o Excel: una IA identifica marca/modelo/precio y revisas el resultado antes de confirmar."
    >
      {step === "select" && (
        <ImportSelectStep
          suppliers={suppliers}
          loadingSuppliers={loadingSuppliers}
          supplierId={supplierId}
          onSupplierIdChange={setSupplierId}
          selectedFile={selectedFile}
          isDragging={isDragging}
          fileInputRef={fileInputRef}
          uploading={uploading}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onFileInputChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          onClearFile={() => setSelectedFile(null)}
          onCancel={() => navigate("/commerce/price-list")}
          onUpload={handleUpload}
        />
      )}

      {step === "processing" && <ImportProcessingStep progress={progress} />}

      {step === "preview" && (
        <ImportPreviewStep
          rows={rows}
          saving={saving}
          onAddRow={addRow}
          onUpdateRow={updateRow}
          onRemoveRow={removeRow}
          onDiscard={handleDiscard}
          onConfirm={handleConfirm}
        />
      )}
    </PageShell>
  );
};
