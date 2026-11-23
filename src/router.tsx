import { Outlet, type RouteObject } from 'react-router';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { useEsDesktop } from '@/hooks/useMediaQuery';
import { GruposPage } from '@/pages/GruposPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';

function Root() {
  const esDesktop = useEsDesktop();
  return (
    <AuthProvider>
      <Outlet />
      {/* design.md 7.7: abajo al centro en mobile, abajo a la derecha en desktop; 4 s */}
      <Toaster position={esDesktop ? 'bottom-right' : 'bottom-center'} duration={4000} />
    </AuthProvider>
  );
}

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/ingresar', element: <LoginPage /> },
      { path: '/registrarme', element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [
          { element: <AppShell />, children: [{ path: '/grupos', element: <GruposPage /> }] },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
