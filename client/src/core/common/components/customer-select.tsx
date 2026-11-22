import { useEffect, useRef, useState, type FC } from "react";
import { useCustomers } from "@commerce/customers/hooks/use-customers";
import { labelFor } from "@commerce/customers/utils/format";
import type { Customer } from "@commerce/customers/types/customers";
import type { CustomerSelectProps } from "../props/customer-select-props";

// Selector de cliente existente -- al elegir uno, el caller decide si
// autollena nombre/telefono (ver repair-note-form-page / quote-form-page).
// Nunca obliga a tener cliente guardado: el caller conserva los campos de
// texto libre para clientes de paso.
// El texto se escribe sin lag, pero la lista solo refiltra 350ms despues de
// la ultima tecla -- evita recalcular el filtro en cada pulsacion.
export const CustomerSelect: FC<CustomerSelectProps> = ({
  value,
  onChange,
  placeholder = "Cliente existente (opcional)",
  disabled,
  className = "",
}) => {
  const { customers, loading, fetchAll } = useCustomers();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const selected = customers.find((c) => c.id === value);
    setQuery(selected ? labelFor(selected) : "");
  }, [value, customers]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = debouncedQuery.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)).slice(0, 8)
    : customers.slice(0, 8);

  const handlePick = (c: Customer) => {
    onChange(c.id, c);
    setQuery(labelFor(c));
    setOpen(false);
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (!text) onChange("", null);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled || loading}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-theme-xs transition-colors duration-200 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 ${className}`}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(c)}
                className="block w-full px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {labelFor(c)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

