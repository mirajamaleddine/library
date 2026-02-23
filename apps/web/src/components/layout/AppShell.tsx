import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { DYNAMIC_SEGMENT_TITLE, NAV_ITEMS, PATHS, SEGMENT_TITLES } from "@/lib/routes";
import { SignedIn, useAuth, useClerk, UserAvatar, useUser } from "@clerk/clerk-react";
import { ChevronsUpDown, GalleryVerticalEnd, LogOut, Settings } from "lucide-react";
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

function useBreadcrumbs(): { label: string; path: string | null }[] {
  const { pathname } = useLocation();
  const segments = pathname
    .replace(/^\/|\/$/g, "")
    .split("/")
    .filter(Boolean);

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

function SidebarUserBlock() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const { openUserProfile } = useClerk();
  const isMobile = useIsMobile();
  const navigateToProfile = () => {
    void openUserProfile();
  };
  if (!isLoaded || !user) return null;

  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    (user.username ?? null) ||
    (user.primaryEmailAddress?.emailAddress ?? null) ||
    "User";
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const trigger = (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <UserAvatar />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        {email != null && email !== "" && <span className="truncate text-xs">{email}</span>}
      </div>
      <ChevronsUpDown className="ml-auto size-4" />
    </SidebarMenuButton>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side={isMobile ? "bottom" : "top"}
        align="center"
        sideOffset={4}
      >
        <DropdownMenuItem onClick={() => navigateToProfile()}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell() {
  const crumbs = useBreadcrumbs();

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
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
  const { pathname } = useLocation();

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
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive} size="lg">
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2",
                        isActive
                          ? "text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SignedIn>
          <SidebarUserBlock />
        </SignedIn>
      </SidebarFooter>
    </Sidebar>
  );
}
