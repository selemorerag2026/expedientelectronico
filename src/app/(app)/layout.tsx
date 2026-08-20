import { redirect } from "next/navigation";

import { logout } from "@/app/login/actions";
import { AppSidebar } from "@/components/app-sidebar";
import { BusquedaGlobal } from "@/components/busqueda-global";
import { getUsuarioActual } from "@/lib/auth/usuario-actual";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actual = await getUsuarioActual();

  if (!actual) {
    redirect("/login");
  }

  const { user, perfil } = actual;

  return (
    <div className="app-gradient-bg flex min-h-full flex-1">
      <AppSidebar
        className="shell-sidebar"
        nombre={perfil?.nombre_completo ?? user.email ?? "Usuario"}
        rol={perfil?.role ?? "sin rol"}
        onLogout={logout}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="shell-header flex items-center px-3 py-3 sm:px-4">
          <BusquedaGlobal />
        </header>
        <main className="shell-main flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
