import { createContext } from "react";

import type { SidebarContextType } from "../types/interfaces/contexts/sidebar-context-type";

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

