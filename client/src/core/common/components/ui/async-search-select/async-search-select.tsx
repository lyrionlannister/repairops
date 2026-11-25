import { useId } from "react";
import { Search } from "lucide-react";
import { useAsyncSearchSelect } from "../../../hooks/use-async-search-select";
import type { AsyncSearchSelectProps } from "../../../props/async-search-select-props";

// Selector con busqueda en el servidor: sustituye a un <select> con el catalogo entero
// (clientes, productos) cuando el catalogo puede tener miles de filas.
export const AsyncSearchSelect = <T,>(props: AsyncSearchSelectProps<T>) => {
  const { getId, getLabel, isDisabled, placeholder, disabled, className = "", ariaLabel } = props;
  const listId = useId();
  const {
    containerRef,
    text,
    open,
    results,
    loading,
    failed,
    activeIndex,
    setOpen,
    pick,
    handleTextChange,
    handleKeyDown,
  } = useAsyncSearchSelect(props);

  const status = loading
    ? "Buscando..."
    : failed
      ? "No pudimos cargar las opciones. Intenta de nuevo."
      : results.length === 0
        ? "Sin resultados. Prueba con otro nombre."
        : null;

  return (
    <div className="relative" ref={containerRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        role="combobox"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={text}
        onChange={(event) => handleTextChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-sm text-gray-800 shadow-theme-xs transition-colors duration-200 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 ${className}`}
      />
      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {status && results.length === 0 ? (
            <li className="px-3.5 py-2 text-sm text-gray-500 dark:text-gray-400">{status}</li>
          ) : (
            results.map((item, index) => {
              const itemDisabled = isDisabled?.(item) ?? false;
              return (
                <li
                  key={getId(item)}
                  role="option"
                  aria-selected={index === activeIndex}
                  aria-disabled={itemDisabled}
                >
                  <button
                    type="button"
                    disabled={itemDisabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(item)}
                    className={`block w-full px-3.5 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                      index === activeIndex
                        ? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {getLabel(item)}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
