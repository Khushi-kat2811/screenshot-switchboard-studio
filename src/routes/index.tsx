import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronDown, Command, Grid2X2, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Booking Holdings | Enterprise Workspace" },
      { name: "description", content: "A focused workspace for Booking Holdings." },
      { property: "og:title", content: "Booking Holdings | Enterprise Workspace" },
      { property: "og:description", content: "A focused workspace for Booking Holdings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

export function WorkspaceApp() {
  const [selectedPage, setSelectedPage] = useState(1);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center border-b border-border bg-card px-5 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Command aria-hidden="true" className="size-[19px]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-[18px] text-foreground">Booking Holdings</p>
            <p className="text-[11px] leading-[15px] text-muted-foreground">Enterprise Workspace</p>
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-2.5 md:flex">
          <span className="text-[13px] font-bold tracking-[0.08em] text-foreground">BOOKING HOLDINGS</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 px-3 text-[13px] font-medium text-secondary-foreground">Log In</Button>
          <Button size="sm" className="h-9 gap-2 px-3.5 text-[13px] font-semibold shadow-sm">
            Sign Up <ArrowRight aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-screen pt-[68px]">
        <aside className={`${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarVisible ? "" : "md:hidden"} fixed inset-y-[68px] left-0 z-20 w-[260px] border-r border-border bg-card transition-transform duration-200 md:sticky md:top-[68px] md:h-[calc(100vh-68px)] md:w-[260px] md:translate-x-0`}>
          <div className="px-5 pb-3 pt-7">
            <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground">PAGES NAVIGATION</p>
          </div>
          <nav aria-label="Pages navigation" className="space-y-1 px-3">
            {Array.from({ length: 5 }, (_, index) => {
              const pageNumber = index + 1;
              const active = selectedPage === pageNumber;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setSelectedPage(pageNumber);
                    setMobileNavOpen(false);
                  }}
                  className={`group flex min-h-[54px] w-full items-center gap-3 rounded-md border px-3 text-left transition-colors ${active ? "border-primary/10 bg-accent" : "border-transparent hover:bg-muted/70"}`}
                >
                  <span className={`flex size-[23px] shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {pageNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[12px] font-medium leading-[17px] ${active ? "text-foreground" : "text-secondary-foreground"}`}>Page {pageNumber}</span>
                    <span className="block text-[10px] leading-[14px] text-muted-foreground">Blank Workspace</span>
                  </span>
                  <ArrowRight aria-hidden="true" className={`size-3.5 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`} />
                </button>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 hidden items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground md:flex">
            <Grid2X2 aria-hidden="true" className="size-3.5" />
            <span>Workspace</span>
            <ChevronDown aria-hidden="true" className="ml-auto size-3.5" />
          </div>
        </aside>

        {mobileNavOpen && <button aria-label="Close navigation" className="fixed inset-0 z-10 bg-foreground/20 md:hidden" onClick={() => setMobileNavOpen(false)} />}

        <section className="min-w-0 flex-1 px-5 pb-8 pt-6 md:px-8 md:pt-7">
          <div className="mb-5 flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label={sidebarVisible ? "Hide pages navigation" : "Show pages navigation"}
              title={sidebarVisible ? "Hide pages navigation" : "Show pages navigation"}
              className="hidden size-9 shrink-0 bg-card md:inline-flex"
              onClick={() => setSidebarVisible((visible) => !visible)}
            >
              {sidebarVisible ? (
                <PanelLeftClose aria-hidden="true" className="size-4" />
              ) : (
                <PanelLeftOpen aria-hidden="true" className="size-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open pages navigation"
              className="size-9 bg-card md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu aria-hidden="true" className="size-4" />
            </Button>
            <div>
              <p className="mb-1 text-[10px] font-medium tracking-[0.08em] text-muted-foreground md:hidden">WORKSPACE</p>
              <h1 className="text-[20px] font-semibold leading-7 text-foreground">Page {selectedPage}</h1>
            </div>
          </div>
          <div aria-label={`Page ${selectedPage} blank workspace`} className="workspace-shadow min-h-[calc(100vh-156px)] rounded-lg border border-border bg-card md:min-h-[calc(100vh-160px)]" />
        </section>
      </div>
    </main>
  );
}

function Index() {
  return <WorkspaceApp />;
}
