import { createContext } from "react";
import type { ToastContextType } from "../types/toast-context";

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

