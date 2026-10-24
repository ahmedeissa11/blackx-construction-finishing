"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { buildLocaleSwitchHref } from "@/lib/i18n";
import type { Dictionary } from "@/content/dictionary";
import { siteHref, siteNav } from "@/config/navigation";
import { BrandLockup } from "@/components/brand/Logo";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [urlSuffix, setUrlSuffix] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const { documentElement, body } = document;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      documentElement.style.overflow = previousDocumentOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => drawerCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    function syncScrolled() {
      setScrolled(window.scrollY > 20);
    }
    syncScrolled();
    window.addEventListener("scroll", syncScrolled, { passive: true });
    return () => window.removeEventListener("scroll", syncScrolled);
  }, []);

  useEffect(() => {
    function syncUrlSuffix() {
      setUrlSuffix(`${window.location.search}${window.location.hash}`);
    }
    syncUrlSuffix();
    window.addEventListener("hashchange", syncUrlSuffix);
    window.addEventListener("popstate", syncUrlSuffix);
    return () => {
      window.removeEventListener("hashchange", syncUrlSuffix);
      window.removeEventListener("popstate", syncUrlSuffix);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
        return;
      }

      if (e.key !== "Tab" || !drawerRef.current) return;
      const drawerFocusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
      const focusable = drawerFocusable;
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (!focusable.includes(document.activeElement as HTMLElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    const desktop = window.matchMedia("(min-width: 1021px)");
    function closeOnDesktop() {
      if (desktop.matches) setOpen(false);
    }
    closeOnDesktop();

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function closeMenuAndReturnFocus() {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
  }

  function isActive(segment: string): boolean {
    if (segment === "") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(`/${locale}/${segment}`);
  }

  return (
    <header ref={headerRef} className="site-header" data-scrolled={scrolled} data-menu-open={open}>
      <div className="container header-in">
        <BrandLockup locale={locale} dict={dict} />
        <nav className="main-nav" aria-label={dict.nav.menu}>
          {siteNav.map((item) => (
            <Link
              key={item.key}
              href={siteHref(locale, item.segment)}
              className={isActive(item.segment) ? "active" : undefined}
              aria-current={isActive(item.segment) ? "page" : undefined}
            >
              {dict.nav[item.key]}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <div className="locale-switch" role="group" aria-label="Language / اللغة">
            <Link
              href={buildLocaleSwitchHref(pathname, "ar", urlSuffix)}
              className={locale === "ar" ? "current" : undefined}
              aria-current={locale === "ar" ? "true" : undefined}
            >
              عربي
            </Link>
            <Link
              href={buildLocaleSwitchHref(pathname, "en", urlSuffix)}
              className={locale === "en" ? "current" : undefined}
              aria-current={locale === "en" ? "true" : undefined}
            >
              EN
            </Link>
          </div>
          <Link href={siteHref(locale, "request")} className="btn btn-primary btn-sm">
            {dict.nav.requestCta}
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.close : dict.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      <div
        className={`mobile-nav-scrim${open ? " open" : ""}`}
        aria-hidden="true"
        onPointerDown={closeMenu}
      />
      <div
        ref={drawerRef}
        id="mobile-menu"
        className={`mobile-panel${open ? " open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label={dict.nav.menu}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="mobile-drawer-head">
          <BrandLockup locale={locale} dict={dict} dark onClick={closeMenu} />
          <button
            ref={drawerCloseRef}
            type="button"
            className="mobile-drawer-close"
            aria-label={dict.nav.close}
            onClick={closeMenuAndReturnFocus}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label={dict.nav.menu}>
          {siteNav.map((item) => (
            <Link
              key={item.key}
              href={siteHref(locale, item.segment)}
              className={isActive(item.segment) ? "active" : undefined}
              aria-current={isActive(item.segment) ? "page" : undefined}
              onClick={closeMenu}
            >
              {dict.nav[item.key]}
            </Link>
          ))}
          <Link
            href={siteHref(locale, "faqs")}
            className={isActive("faqs") ? "active" : undefined}
            aria-current={isActive("faqs") ? "page" : undefined}
            onClick={closeMenu}
          >
            {dict.nav.faqs}
          </Link>
        </nav>
        <div className="mp-actions">
          <Link href={siteHref(locale, "request")} className="btn btn-primary" onClick={closeMenu}>
            {dict.nav.requestCta}
          </Link>
          <div className="mp-locale-switch" role="group" aria-label="Language / اللغة">
            <Link
              href={buildLocaleSwitchHref(pathname, "ar", urlSuffix)}
              className={locale === "ar" ? "current" : undefined}
              aria-current={locale === "ar" ? "true" : undefined}
              onClick={closeMenu}
            >
              عربي
            </Link>
            <Link
              href={buildLocaleSwitchHref(pathname, "en", urlSuffix)}
              className={locale === "en" ? "current" : undefined}
              aria-current={locale === "en" ? "true" : undefined}
              onClick={closeMenu}
            >
              English
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
