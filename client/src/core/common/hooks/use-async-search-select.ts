import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useApiClient } from "./use-api-client";
import { useAsyncSearch } from "./use-async-search";
import type { AsyncSearchSelectProps } from "../props/async-search-select-props";

export const useAsyncSearchSelect = <T>({
  path,
  filters,
  value,
  onSelect,
  getId,
  getLabel,
  isDisabled,
  resolvePath,
  selectedLabel,
}: AsyncSearchSelectProps<T>) => {
  const { apiClient } = useApiClient();
  const [text, setText] = useState(selectedLabel ?? "");
  const [typed, setTyped] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const labelOf = useRef(new Map<string, string>());
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, loading, failed } = useAsyncSearch<T>(path, typed ? text : "", filters, {
    enabled: open,
  });

  // Un valor que llega ya elegido (al editar) se etiqueta pidiendolo por id, sin
  // descargar el catalogo completo.
  useEffect(() => {
    if (!value) {
      if (!typed) setText("");
      return;
    }
    const known = selectedLabel ?? labelOf.current.get(value);
    if (known) {
      setText(known);
      return;
    }
    if (!resolvePath) return;
    let cancelled = false;
    apiClient(resolvePath(value))
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const label = getLabel((await response.json()) as T);
        labelOf.current.set(value, label);
        setText(label);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedLabel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const close = () => {
    setOpen(false);
    setTyped(false);
    const label = value ? (labelOf.current.get(value) ?? selectedLabel) : undefined;
    setText(label ?? (value ? text : ""));
  };

  const pick = (item: T) => {
    if (isDisabled?.(item)) return;
    const label = getLabel(item);
    labelOf.current.set(getId(item), label);
    onSelect(item);
    setText(label);
    setTyped(false);
    setOpen(false);
  };

  const handleTextChange = (next: string) => {
    setText(next);
    setTyped(true);
    setOpen(true);
    if (!next && value) onSelect(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      pick(results[activeIndex]);
    } else if (event.key === "Escape") {
      close();
    }
  };

  return {
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
  };
};
