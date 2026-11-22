import { useCallback } from "react";

// ApexCharts ignora el resize del contenedor mientras su propia animación no termina, así que
// al colapsar/expandir el sidebar (300ms de transición) una gráfica podía quedarse con el ancho
// viejo. Su handler de resize de ventana no tiene esa condición: se avisa al terminar la transición.
export const useLayoutResizeNotifier = () =>
  useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "margin-left") return;
    window.dispatchEvent(new Event("resize"));
  }, []);
