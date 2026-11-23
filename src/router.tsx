import { Outlet, type RouteObject } from 'react-router';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { GruposPage } from '@/pages/GruposPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';

function Root() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
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
