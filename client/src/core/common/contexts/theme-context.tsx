"use client";

import { createContext } from "react";

import ThemeContextType from "../types/interfaces/contexts/theme-context-type";

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

