import { Suspense, useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useLocalState } from "../../lib/hooks";
import { SlideOver } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";
import { CommandPalette } from "./CommandPalette";
import { CreateProvider } from "./CreateContext";
import { Sidebar, SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";

export const PageFallback = (): JSX.Element => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Spinner className="muted h-6 w-6" />
  </div>
);

export const AppLayout = (): JSX.Element => {
  const [collapsed, setCollapsed] = useLocalState("bmx-sidebar-collapsed", false);
  const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNav(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closePalette = useCallback(() => setPalette(false), []);
  const closeNav = useCallback(() => setMobileNav(false), []);

  return (
    <CreateProvider>
      <div className="flex min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileNav(true)} onSearch={() => setPalette(true)} />
          <main id="main" className="mx-auto w-full max-w-[1480px] flex-1 px-3 py-5 sm:px-5 lg:px-7 lg:py-7">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
      <SlideOver open={mobileNav} title="Navigation" onClose={closeNav} side="left" width={280} bare>
        <SidebarContent onNavigate={closeNav} />
      </SlideOver>
      <CommandPalette open={palette} onClose={closePalette} />
    </CreateProvider>
  );
};
