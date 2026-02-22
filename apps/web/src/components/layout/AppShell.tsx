import { Separator } from "@/components/ui/separator";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { GalleryVerticalEnd } from "lucide-react";
import type React from "react";
import { Fragment } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../ui/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { DYNAMIC_SEGMENT_TITLE, NAV_ITEMS, PATHS, SEGMENT_TITLES } from "@/lib/routes";
import { cn } from "@/lib/cn";

function useBreadcrumbs(): { label: string; path: string | null }[] {
  const { pathname } = useLocation();
  const segments = pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: SEGMENT_TITLES.books ?? "Books", path: null }];
  }

  const crumbs: { label: string; path: string | null }[] = [];
  let acc = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += (acc ? "/" : "") + seg;
    const label =
      SEGMENT_TITLES[seg] ??
      (seg.length === 36 || /^[0-9a-f-]{36}$/i.test(seg) ? DYNAMIC_SEGMENT_TITLE : seg);
    crumbs.push({ label, path: i === segments.length - 1 ? null : `/${acc}` });
  }

  return crumbs;
}

export function AppShell() {
  const crumbs = useBreadcrumbs();

  return (
    <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((crumb, i) => (
                <Fragment key={crumb.path ?? `crumb-${i}`}>
                  {i > 0 && <BreadcrumbSeparator className="hidden sm:inline-flex" />}
                  <BreadcrumbItem className={i > 0 ? "hidden sm:inline-flex" : undefined}>
                    {crumb.path != null ? (
                      <Link
                        to={crumb.path}
                        className={cn(
                          "text-muted-foreground hover:text-foreground text-sm transition-colors",
                        )}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={PATHS.home}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Shelfbase</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild>
                  <Link to={item.path} className="font-medium">
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </SidebarFooter>
    </Sidebar>
  );
}
