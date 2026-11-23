import type { FormEvent, InvalidEvent } from "react";

const spanishValidationMessage = (input: HTMLInputElement): string => {
  const validity = input.validity;
  if (validity.valueMissing) return "Completa este campo.";
  if (validity.typeMismatch)
    return input.type === "email"
      ? "Ingresa un correo electrónico válido."
      : "El formato no es válido.";
  if (validity.tooShort) return `Usa al menos ${input.minLength} caracteres.`;
  if (validity.tooLong) return `Usa como máximo ${input.maxLength} caracteres.`;
  if (validity.rangeUnderflow) return `El valor debe ser mayor o igual a ${input.min}.`;
  if (validity.rangeOverflow) return `El valor debe ser menor o igual a ${input.max}.`;
  if (validity.patternMismatch) return "El formato no es válido.";
  if (validity.badInput) return "Valor inválido.";
  return "Revisa este campo.";
};

export const handleNativeInvalid = (e: InvalidEvent<HTMLInputElement>): void => {
  e.currentTarget.setCustomValidity(spanishValidationMessage(e.currentTarget));
};

export const clearNativeValidity = (e: FormEvent<HTMLInputElement>): void => {
  e.currentTarget.setCustomValidity("");
};
