import type { ValidationError } from "class-validator";

// class-validator pone los mensajes de un campo anidado (ej. @ValidateNested
// en un arreglo de items) en error.children[], no en error.constraints -- un
// .map(e => e.constraints) superficial los pierde en silencio y devuelve un
// arreglo vacio aunque la validacion si fallo. Recorre children de forma
// recursiva para que ningun mensaje se pierda.
// Sin duplicados: cada linea de un arreglo repite el mismo mensaje y la
// pantalla lo mostraria N veces.
export function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) messages.push(...Object.values(error.constraints));
    if (error.children?.length) messages.push(...flattenValidationErrors(error.children));
  }
  return [...new Set(messages)];
}
