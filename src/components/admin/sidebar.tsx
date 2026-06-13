"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Users, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAND } from "@/modules/shared/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logoutAction } from "@/app/admin/login/actions";

const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Workflows", href: "/admin/workflows", icon: Workflow },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  asSheetClose,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  asSheetClose?: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="size-[18px]" />
      {label}
    </Link>
  );

  return asSheetClose ? <SheetClose asChild>{link}</SheetClose> : link;
}

function NavLinks({ pathname, asSheetClose }: { pathname: string; asSheetClose?: boolean }) {
  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV_LINKS.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          label={link.label}
          icon={link.icon}
          active={isActive(pathname, link.href)}
          asSheetClose={asSheetClose}
        />
      ))}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex flex-col leading-none">
      <span className="text-lg font-bold tracking-tight text-white">{BRAND.name} Admin</span>
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">{BRAND.fullName}</span>
    </div>
  );
}

function SidebarFooter({ adminEmail }: { adminEmail: string }) {
  return (
    <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
      <p className="truncate text-xs text-muted">Signed in as {adminEmail}</p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          <LogOut className="size-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.02] p-5 lg:flex">
        <SidebarBrand />
        <div className="mt-6 flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <SidebarFooter adminEmail={adminEmail} />
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-brand-navy/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <SidebarBrand />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SidebarBrand />
            <div className="mt-6 flex-1">
              <NavLinks pathname={pathname} asSheetClose />
            </div>
            <SidebarFooter adminEmail={adminEmail} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
