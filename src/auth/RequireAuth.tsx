import { Navigate, Outlet, useLocation } from 'react-router';
import { AppShellSkeleton } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';

/** Protege las rutas hijas: sin sesión, manda al login y recuerda de dónde venía (CA-05.1). */
export function RequireAuth() {
  const { status, retry, sesionExpirada } = useAuth();
  const location = useLocation();

  if (status === 'anonymous') {
    const destino = sesionExpirada ? '/ingresar?sesion=expirada' : '/ingresar';
    return <Navigate to={destino} replace state={{ from: location.pathname }} />;
  }
  if (status === 'loading') return <AppShellSkeleton />;
  if (status === 'error') {
    return (
      <main className="grid min-h-svh place-items-center px-4">
        <div
          role="alert"
          className="grid max-w-sm justify-items-start gap-3 rounded-[14px] bg-debes/10 p-6"
        >
          <p className="font-semibold text-debes">No hay conexión con el servidor</p>
          <p className="text-pencil">
            No pudimos verificar tu sesión. Revisá tu conexión y probá de nuevo.
          </p>
          <Button variant="outline" onClick={retry}>
            Reintentar
          </Button>
        </div>
      </main>
    );
  }
  return <Outlet />;
}
