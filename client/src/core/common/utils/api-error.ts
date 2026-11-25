export const apiErrorText = (body: unknown, fallback: string): string => {
  const error = (body as { error?: unknown } | null)?.error;
  if (Array.isArray(error)) return error.length ? error.join(". ") : fallback;
  return typeof error === "string" && error.trim() ? error : fallback;
};

export const readApiError = async (response: Response, fallback: string): Promise<string> => {
  const body = await response
    .clone()
    .json()
    .catch(() => null);
  return apiErrorText(body, fallback);
};
