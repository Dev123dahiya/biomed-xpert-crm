import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

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
  const pointer = useRef({ x: window.innerWidth - 40, y: 40 });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Remember where the user last clicked, so the theme can spread out from there.
  useEffect(() => {
    const onDown = (e: PointerEvent) => { pointer.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  const setChoice = useCallback((c: ThemeChoice) => {
    const nextDark = c === "dark" || (c === "system" && systemDark());
    const apply = () => {
      flushSync(() => setChoiceState(c));
      document.documentElement.classList.toggle("dark", nextDark);
    };
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* storage can be unavailable in private mode */
    }
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce || nextDark === document.documentElement.classList.contains("dark")) {
      apply();
      return;
    }
    const { x, y } = pointer.current;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const t = doc.startViewTransition(apply);
    t.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 520, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => undefined);
  }, []);
  const toggle = useCallback(() => setChoice(dark ? "light" : "dark"), [dark, setChoice]);

  return <ThemeContext.Provider value={{ choice, dark, setChoice, toggle }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeState => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
