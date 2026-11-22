export interface PdfPreviewProps {
  url: string | null;
  loading: boolean;
  error: string | null;
  title: string;
  onDownload: () => void;
  onOpen: () => void;
}
