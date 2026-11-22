export function parseAbsoluteUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol && parsed.hostname ? parsed : null;
  } catch {
    return null;
  }
}
