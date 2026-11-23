import type { ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?:
    | "primary"
    | "outline"
    | "secondary"
    | "success"
    | "danger"
    | "warning";
  type?: "button" | "submit" | "reset";
  // id del <form> que envía este botón cuando vive fuera de él.
  form?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
