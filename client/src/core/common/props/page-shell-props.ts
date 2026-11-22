import type { ReactNode } from "react";

export type PageShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  // true: la página entera crece y scrollea en la capa del layout (scrollbar al borde, título incluido).
  scrollHeader?: boolean;
  children: ReactNode;
};
