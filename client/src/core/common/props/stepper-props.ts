export interface StepProps {
  index: number;
  current: number;
  // Clases del contenedor cuando el paso está activo (p. ej. un grid de columnas).
  className?: string;
  children: React.ReactNode;
}

export interface StepperProps {
  steps: string[];
  current: number;
  onStepClick: (index: number) => void;
}
