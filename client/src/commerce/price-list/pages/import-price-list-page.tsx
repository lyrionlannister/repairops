import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { useImportStaging, type StagingRow } from "../hooks/use-import-staging";
import { Alert } from "@ui/alert/alert";
import { PageMeta } from "@common/pages/page-meta";
import { ImportSelectStep } from "../components/import-select-step";
import { ImportPreviewStep } from "../components/import-preview-step";

type Step = "select" | "processing" | "preview";

const POLL_INTERVAL_MS = 2500;

export const ImportPriceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers, loading: loadingSuppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const { uploading, saving, error, upload, fetchById, updateRows, commit, discard } = useImportStaging();

  const [step, setStep] = useState<Step>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [rows, setRows] = useState<StagingRow[]>([]);
  const [stagingError, setStagingError] = useState<string | null>(null);
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
    const interval = setInterval(async () => {
      const record = await fetchById(importId);
      if (!record) return;
      if (record.status === "ready") {
        setRows(record.rows);
        setStep("preview");
      } else if (record.status === "error") {
        setStagingError(record.error ?? "La IA no pudo procesar el archivo");
        setStep("select");
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [step, importId, fetchById]);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setStagingError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !supplierId) return;
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
    navigate("/app/price-list", { state: { imported: result.imported } });
  };

  const handleDiscard = async () => {
    if (importId) await discard(importId);
    setImportId(null);
    setRows([]);
    setSelectedFile(null);
    setStep("select");
  };

  return (
    <div className="space-y-6">
      <PageMeta title="Importar lista de precios" description="Importar lista de precios con IA" />
      <div>
        <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">Importar lista de precios</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sube un PDF o Excel: una IA identifica marca/modelo/precio y revisas el resultado antes de confirmar.
        </p>
      </div>

      {(error || stagingError) && <Alert variant="error" title="Error" message={error ?? stagingError ?? ""} />}

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
          onCancel={() => navigate("/app/price-list")}
          onUpload={handleUpload}
        />
      )}

      {step === "processing" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-white/3 flex flex-col items-center gap-4">
          <Loader2 className="size-8 text-brand-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            La IA está identificando marca, modelo y precio en el archivo...
          </p>
        </div>
      )}

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
    </div>
  );
};
