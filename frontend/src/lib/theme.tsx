import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeChoice = "light" | "dark" | "system";
interface ThemeState { choice: ThemeChoice; dark: boolean; setChoice: (c: ThemeChoice) => void; toggle: () => void; }
const ThemeContext = createContext<ThemeState | undefined>(undefined);
const KEY = "bmx-theme";

const systemDark = (): boolean => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
const readChoice = (): ThemeChoice => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const [sysDark, setSysDark] = useState<boolean>(systemDark);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const fn = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const dark = choice === "dark" || (choice === "system" && sysDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* storage can be unavailable in private mode */
    }
  }, []);
  const toggle = useCallback(() => setChoice(dark ? "light" : "dark"), [dark, setChoice]);

  return <ThemeContext.Provider value={{ choice, dark, setChoice, toggle }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeState => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
