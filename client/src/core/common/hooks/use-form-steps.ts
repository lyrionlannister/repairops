import { useRef, useState } from "react";

// Estado de un formulario por pasos. Todos los pasos quedan montados (solo se
// ocultan) y cada contenedor lleva data-step="<n>"; "next" valida los campos
// del paso actual con la validación nativa antes de avanzar.
export const useFormSteps = (count: number) => {
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const isLast = step === count - 1;

  const currentStepIsValid = () => {
    const invalid = formRef.current?.querySelector<HTMLInputElement>(`[data-step="${step}"] :invalid`);
    invalid?.reportValidity();
    return !invalid;
  };

  const next = () => {
    if (!isLast && currentStepIsValid()) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const goTo = (index: number) => {
    if (index < step) setStep(index);
  };

  return { step, isLast, formRef, next, back, goTo };
};
