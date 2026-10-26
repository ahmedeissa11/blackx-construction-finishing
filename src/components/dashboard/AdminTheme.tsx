"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n";
import {
  ADMIN_THEME_KEY,
  adminThemeBootstrap,
  isAdminTheme,
  resolveAdminTheme,
  type AdminTheme,
} from "@/lib/admin-theme";

const ThemeContext = createContext<{ theme: AdminTheme | null; toggle: () => void } | null>(null);

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const boundary = useRef<HTMLDivElement>(null);
  const explicit = useRef<AdminTheme | null>(null);
  // No SSR theme guess. The bootstrap owns the first paint; the effect adopts it.
  const [theme, setTheme] = useState<AdminTheme | null>(null);
  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (value: AdminTheme) => {
      if (boundary.current) boundary.current.dataset.adminTheme = value;
      setTheme(value);
    };
    const read = () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(ADMIN_THEME_KEY);
      } catch {
        // A blocked storage API must not prevent using the application.
      }
      explicit.current = isAdminTheme(stored) ? stored : null;
      apply(resolveAdminTheme(stored, media.matches));
    };
    read();
    const onSystem = () => {
      if (!explicit.current) apply(resolveAdminTheme(null, media.matches));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_THEME_KEY || event.key === null) read();
    };
    media.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystem);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function toggle() {
    const current = boundary.current?.dataset.adminTheme ?? theme;
    const next: AdminTheme = current === "dark" ? "light" : "dark";
    explicit.current = next;
    if (boundary.current) boundary.current.dataset.adminTheme = next;
    setTheme(next);
    try {
      window.localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      // Still applies for this mounted workspace when storage is unavailable.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div ref={boundary} className="admin-theme-root" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: adminThemeBootstrap }} />
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function AdminThemeToggle({ locale }: { locale: Locale }) {
  const context = useContext(ThemeContext);
  // Reusable shells rendered outside the guarded Admin layout stay unchanged.
  if (!context) return null;
  const dark = context.theme === "dark";
  const label =
    locale === "ar"
      ? dark
        ? "التبديل إلى الوضع الفاتح"
        : "التبديل إلى الوضع الداكن"
      : dark
        ? "Switch to light mode"
        : "Switch to dark mode";
  return (
    <button
      type="button"
      className="admin-theme-toggle"
      aria-label={label}
      aria-pressed={dark}
      title={label}
      onClick={context.toggle}
    >
      <svg
        className="theme-sun"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </svg>
      <svg
        className="theme-moon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z" />
      </svg>
      <span>{locale === "ar" ? "المظهر" : "Appearance"}</span>
    </button>
  );
}
