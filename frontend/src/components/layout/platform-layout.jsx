import { useEffect, useId, useState } from "react";
import { useSidebarState } from "./sidebar-state";
import { Link } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function PlatformSidebar({ children, toggle, compact = false }) {
  return (
    <div className="platform-sidebar-inner">
      <div className="platform-sidebar-brand">
        <Link
          to="/app"
          className="platform-sidebar-logo rounded-sm focus-visible:outline-2"
          tabIndex={compact ? -1 : undefined}
          aria-hidden={compact || undefined}
        >
          <img
            src="/brand/olympic-school-wordmark.png"
            width="296"
            height="82"
            alt="Olympic School"
          />
        </Link>
        {toggle}
      </div>
      <div className="platform-sidebar-scroll">{children}</div>
      <div className="platform-sidebar-profile">
        <UserMenu compact={compact} showTeacherLink />
      </div>
    </div>
  );
}

export function PlatformLayout({ sidebar, renderHeader, children, assistant = false }) {
  const [desktopOpen, setDesktopOpen] = useSidebarState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarId = useId();
  const sidebarName = assistant ? "Menu do assistente" : "Menu de estudos";
  useEffect(() => {
    if (!mobileOpen) return;
    const desktop = window.matchMedia("(min-width: 48rem)");
    function closeOnDesktop(event) {
      if (event.matches) setMobileOpen(false);
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [mobileOpen]);

  const DesktopIcon = desktopOpen ? PanelLeftClose : PanelLeftOpen;
  const desktopToggle = (
    <button
      type="button"
      className="platform-icon-button hidden md:inline-grid"
      onClick={() => setDesktopOpen((open) => !open)}
      aria-expanded={desktopOpen}
      aria-controls={sidebarId}
      aria-label={
        desktopOpen
          ? assistant
            ? "Ocultar menu lateral"
            : "Recolher menu lateral"
          : "Mostrar menu lateral"
      }
    >
      <DesktopIcon size={20} aria-hidden="true" />
    </button>
  );
  const controls = (
    <>
      {assistant && desktopToggle}
      <SheetTrigger asChild>
        <button
          type="button"
          className="platform-icon-button inline-grid md:hidden"
          aria-label="Mostrar menu lateral"
        >
          <PanelLeftOpen size={20} aria-hidden="true" />
        </button>
      </SheetTrigger>
    </>
  );

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div
        className={
          assistant
            ? "platform-theme platform-shell platform-chat"
            : "platform-theme platform-shell"
        }
      >
        <aside
          id={sidebarId}
          aria-label={sidebarName}
          className="platform-sidebar hidden md:block"
          data-collapsed={!desktopOpen}
          inert={assistant && !desktopOpen}
        >
          <PlatformSidebar
            toggle={!assistant && desktopToggle}
            compact={!assistant && !desktopOpen}
          >
            {sidebar()}
          </PlatformSidebar>
        </aside>
        <SheetContent
          side="left"
          closeLabel="Ocultar menu lateral"
          aria-describedby={undefined}
          className="platform-theme platform-sidebar-drawer w-[min(85vw,18rem)] border-0 p-0 md:hidden"
        >
          <SheetTitle className="sr-only">{sidebarName}</SheetTitle>
          <PlatformSidebar>{sidebar(() => setMobileOpen(false))}</PlatformSidebar>
        </SheetContent>
        <div className="platform-main">
          {renderHeader({
            controls,
            profile: (
              <UserMenu
                compact
                showTeacherLink
                className={!assistant || desktopOpen ? "md:hidden" : ""}
              />
            ),
          })}
          {children}
        </div>
      </div>
    </Sheet>
  );
}
