import type { FC, TextareaHTMLAttributes } from "react";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  className?: string;
  error?: boolean;
  hint?: string;
}

// Mismo esqueleto visual que Input.tsx -- antes cada page tenia su propio
// <textarea> con clases ligeramente distintas (rounded-xl sin shadow-theme-xs).
export const TextArea: FC<TextAreaProps> = ({ className = "", disabled, error = false, hint, rows = 3, ...rest }) => {
  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 transition-colors duration-200 focus:outline-hidden dark:placeholder:text-gray-500 ${className}`;

  if (disabled) {
    textareaClasses += ` cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400`;
  } else if (error) {
    textareaClasses += ` bg-transparent border-error-500 text-gray-800 focus:border-error-300 focus:ring-3 focus:ring-error-500/20 dark:border-error-500 dark:bg-gray-900 dark:text-white/90`;
  } else {
    textareaClasses += ` bg-transparent border-gray-300 text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`;
  }

  return (
    <div className="relative">
      <textarea rows={rows} disabled={disabled} className={textareaClasses} {...rest} />
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>{hint}</p>
      )}
    </div>
  );
};

