import type { FC } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

// Vuelve a la página inmediatamente anterior del historial.
export const BackButton: FC = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Regresar"
      className="rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:p-1.5 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <ArrowLeft className="size-5" />
    </button>
  );
};
