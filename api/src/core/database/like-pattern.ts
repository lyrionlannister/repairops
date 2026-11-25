// `%` y `_` que escribe el usuario se buscan literales, no como comodines.
export const containsPattern = (search: string): string => `%${search.replace(/[\\%_]/g, "\\$&")}%`;
