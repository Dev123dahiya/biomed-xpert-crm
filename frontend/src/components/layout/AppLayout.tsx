import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
    <Spinner className="muted h-5 w-5" />
  </div>
);

// Shell in the style of Linear and Attio: a dim sidebar on the app background,
// and the page in a raised, rounded panel that scrolls on its own.
export const AppLayout = (): JSX.Element => {
  const [collapsed, setCollapsed] = useLocalState("bmx-sidebar-collapsed", false);
  const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileNav(false);
    mainRef.current?.scrollTo({ top: 0 });
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
      } else if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setCollapsed]);

  const closePalette = useCallback(() => setPalette(false), []);
  const openPalette = useCallback(() => setPalette(true), []);
  const closeNav = useCallback(() => setMobileNav(false), []);

  return (
    <CreateProvider>
      <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Sidebar collapsed={collapsed} onSearch={openPalette} />
        <div className="flex min-w-0 flex-1 flex-col lg:p-2 lg:pl-0">
          <div
            className="flex min-h-0 flex-1 flex-col lg:overflow-hidden lg:rounded-xl lg:border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <Topbar onMenu={() => setMobileNav(true)} onSearch={openPalette} onToggleSidebar={() => setCollapsed(!collapsed)} />
            <main id="main" ref={mainRef} className="scroll-thin flex-1 lg:overflow-y-auto">
              <div className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-5 lg:px-7 lg:py-6">
                <Suspense fallback={<PageFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </div>
      <SlideOver open={mobileNav} title="Navigation" onClose={closeNav} side="left" width={272} bare>
        <SidebarContent onNavigate={closeNav} onSearch={openPalette} />
      </SlideOver>
      <CommandPalette open={palette} onClose={closePalette} />
    </CreateProvider>
  );
};
