// El driver de Postgres devuelve UPDATE ... RETURNING como [rows, rowCount] y
// INSERT ... RETURNING como rows a secas (comprobado empiricamente, no documentado).
export function isRowsTuple<T>(result: T[] | [T[], number]): result is [T[], number] {
  return Array.isArray(result[0]);
}
