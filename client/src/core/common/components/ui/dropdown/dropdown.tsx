import { useEffect, useRef } from "react";

import type { DropdownProps } from "@/core/common/types/interfaces/props/dropdown-props";

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const el = dropdownRef.current;
      if (!el) return;
      // Una copia responsiva oculta por CSS (ej. el selector de sucursal duplicado
      // para mobile/desktop en NavbarMenu) nunca contiene el click real, aunque
      // comparta el mismo onClose: sin este chequeo cierra -- y descarta -- el
      // click dentro de la copia que sí se ve.
      if (el.offsetParent === null) return;
      if (el.contains(event.target as Node)) return;
      if ((event.target as HTMLElement).closest(".dropdown-toggle")) return;
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-40  right-0 mt-2  rounded-xl border border-gray-200 bg-white  shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>
  );
};

