"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { COPY, type Copy, type Lang, type Theme } from "./lib/copy";

/**
 * Cross-page state for the Academy: the active theme (light/dark) and language
 * (EN/ES). Both persist to localStorage and survive route changes, so the header
 * controls stay in sync across the roadmap and every lesson. Theme is reflected
 * onto <html data-theme>, which drives the CSS-variable palette in globals.css.
 *
 * A no-flash inline script in layout.tsx applies the saved theme before React
 * hydrates; here we simply mirror it and keep it updated.
 */

interface AcademyContextValue {
  theme: Theme;
  lang: Lang;
  t: Copy;
  toggleTheme: () => void;
  setLang: (lang: Lang) => void;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  // The personal site is light-only and English-first (matching the design).
  // Theme/lang are pinned; the setters remain for the lessons' API but are
  // effectively no-ops, so no theme/language chrome is exposed anywhere.
  const theme: Theme = "light";
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const toggleTheme = useCallback(() => {}, []);
  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const value = useMemo<AcademyContextValue>(
    () => ({ theme, lang, t: COPY[lang], toggleTheme, setLang }),
    [theme, lang, toggleTheme, setLang],
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy(): AcademyContextValue {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("useAcademy must be used within <AcademyProvider>");
  return ctx;
}
