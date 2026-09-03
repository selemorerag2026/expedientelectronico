"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlugZapIcon,
  StethoscopeIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboardIcon },
  { href: "/pacientes", label: "Pacientes", icon: UsersIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarDaysIcon },
  { href: "/servicios", label: "Servicios", icon: ClipboardListIcon },
  { href: "/cobros", label: "Cobros", icon: WalletIcon },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3Icon,
    soloMedico: true,
  },
  {
    href: "/configuracion",
    label: "Integraciones",
    icon: PlugZapIcon,
    soloMedico: true,
  },
];

export function AppSidebar({
  nombre,
  rol,
  onLogout,
  className,
}: {
  nombre: string;
  rol: string;
  onLogout: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "m-3 flex w-16 shrink-0 flex-col gap-2 rounded-3xl bg-sidebar p-2.5 shadow-[0_2px_24px_-4px_rgba(108,92,224,0.15)] ring-1 ring-black/5 sm:m-4 sm:w-64 sm:p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 px-1 py-2 sm:px-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <StethoscopeIcon className="size-4.5" />
        </div>
        <span className="hidden font-heading text-sm font-semibold sm:inline">
          Expediente CR
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.filter(
          (item) => !item.soloMedico || rol === "medico"
        ).map((item) => {
          const activo =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              // Colores exactos pedidos por el usuario para el contraste del
              // sidebar (fondo oscuro fijo, no vienen del tema claro/oscuro
              // general — por eso van literales y no como var(--...)). El
              // ícono hereda el color del texto solo (currentColor de
              // lucide-react), no hace falta pintarlo aparte.
              className={cn(
                "flex items-center justify-center gap-2.5 rounded-[10px] px-4 py-[11px] text-sm transition-colors sm:justify-start",
                activo
                  ? "bg-[#1E5A78] font-bold text-[#F5FAFB]"
                  : "font-medium text-[#A9C4CE] hover:bg-white/[0.06]"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-2 sm:p-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="truncate text-sm font-medium">{nombre}</span>
        </div>
        <Badge
          variant={rol === "medico" ? "default" : "secondary"}
          className="w-fit"
        >
          {rol}
        </Badge>
        <form action={onLogout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 sm:justify-start"
          >
            <LogOutIcon className="size-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
