import type { TextareaHTMLAttributes } from "react";

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  className?: string;
  error?: boolean;
  hint?: string;
}
