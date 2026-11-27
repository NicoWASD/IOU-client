import { Inbox, LogOut, Settings, Users } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useMisInvitaciones } from '@/api/social';
import { useAuth } from '@/auth/AuthProvider';
import { Logo } from '@/components/brand/Logo';
import { TickyPaseante } from '@/components/brand/TickyPaseante';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// La guía solo la baja quien la necesita (usuario nuevo)
const Tour = lazy(async () => ({ default: (await import('@/components/tour/Tour')).Tour }));

const SECCIONES = [
  { to: '/grupos', texto: 'Grupos', Icono: Users },
  { to: '/invitaciones', texto: 'Invitaciones', Icono: Inbox },
  { to: '/configuracion', texto: 'Configuración', Icono: Settings },
] as const;

function Badge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="absolute -top-1 -right-2 grid min-w-5 place-items-center rounded-full bg-debes px-1 text-[11px] leading-5 font-bold text-white">
      {n}
      <span className="sr-only">{n === 1 ? ' pendiente' : ' pendientes'}</span>
    </span>
  );
}

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

/**
 * Estructura de las pantallas autenticadas (HU-37): en desktop, links en la barra superior;
 * en mobile, barra inferior al alcance del pulgar (design.md 13).
 */
export function AppShell() {
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const pendientes = useMisInvitaciones().data?.length ?? 0;
  // /grupos/:id también cuenta como "Grupos"
  const activa = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-svh">
      <Header>
        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {SECCIONES.map(({ to, texto, Icono }) => (
            <NavLink
              key={to}
              to={to}
              aria-current={activa(to) ? 'page' : undefined}
              className={cn(
                'relative flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-pencil transition-colors hover:bg-birome-soft hover:text-graphite',
                activa(to) && 'bg-birome-soft text-birome',
              )}
            >
              <span className="relative">
                <Icono aria-hidden="true" className="size-4" strokeWidth={1.75} />
                {to === '/invitaciones' && <Badge n={pendientes} />}
              </span>
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="max-w-[40vw] truncate text-sm font-semibold">{usuario?.nombre}</span>
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={logout}>
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </Header>
      <main className="mx-auto max-w-5xl px-4 py-8 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-8">
        <div key={pathname} className="pantalla-entra">
          <Outlet />
        </div>
      </main>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
          {SECCIONES.map(({ to, texto, Icono }) => (
            <li key={to}>
              <NavLink
                to={to}
                aria-current={activa(to) ? 'page' : undefined}
                className={cn(
                  'grid h-full place-items-center content-center gap-0.5 text-xs font-semibold text-pencil transition-[color,scale] active:scale-95',
                  activa(to) && 'text-birome',
                )}
              >
                <span
                  className={cn(
                    'relative grid h-7 w-14 place-items-center rounded-full transition-colors',
                    activa(to) && 'bg-birome-soft',
                  )}
                >
                  <Icono
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={activa(to) ? 2.25 : 1.75}
                  />
                  {to === '/invitaciones' && <Badge n={pendientes} />}
                </span>
                {texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <TickyPaseante pausado={usuario?.tutorialVisto === false} />
      {usuario?.tutorialVisto === false && (
        <Suspense fallback={null}>
          <Tour />
        </Suspense>
      )}
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
