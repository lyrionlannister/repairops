const LABELS: Record<string, string> = {
  image: "Imagen",
  audio: "Audio",
  video: "Video",
  document: "Documento",
  sticker: "Sticker",
  location: "Ubicación",
};

// Etiqueta de un mensaje que no es texto; null para el texto normal.
export const messageTypeLabel = (messageType: string): string | null => LABELS[messageType] ?? null;

export const formatFileSize = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const mapsUrl = (lat: string, lng: string): string => `https://www.google.com/maps?q=${lat},${lng}`;
