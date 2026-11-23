import { LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link to="/grupos" aria-label="IOU, mis grupos">
          <Logo className="h-6" />
        </Link>
        {children}
      </div>
    </header>
  );
}

/** Estructura de las pantallas autenticadas: header con el usuario y cierre de sesión. */
export function AppShell() {
  const { usuario, logout } = useAuth();
  return (
    <div className="min-h-svh">
      <Header>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold sm:inline">{usuario?.nombre}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </Header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="min-h-svh" aria-busy="true">
      <span className="sr-only">Cargando tu sesión</span>
      <Header>
        <Skeleton className="h-8 w-32 bg-muted" />
      </Header>
      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-8">
        <Skeleton className="h-9 w-48 bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[14px] bg-muted" />
          ))}
        </div>
      </main>
    </div>
  );
}
