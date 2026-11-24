import { Outlet, type RouteObject } from 'react-router';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { Toaster } from '@/components/ui/sonner';
import { useEsDesktop } from '@/hooks/useMediaQuery';
import { LandingPage } from '@/pages/LandingPage';

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

// La landing va en el bundle principal; el resto se carga al entrar a cada ruta,
// así la primera visita no baja el código de la app (CA-30.4, Lighthouse ≥ 90).
export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        path: '/ingresar',
        lazy: async () => ({ Component: (await import('@/pages/LoginPage')).LoginPage }),
      },
      {
        path: '/registrarme',
        lazy: async () => ({ Component: (await import('@/pages/RegisterPage')).RegisterPage }),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            lazy: async () => ({ Component: (await import('@/components/AppShell')).AppShell }),
            children: [
              {
                path: '/grupos',
                lazy: async () => ({ Component: (await import('@/pages/GruposPage')).GruposPage }),
              },
              {
                path: '/grupos/:id',
                lazy: async () => ({ Component: (await import('@/pages/GrupoPage')).GrupoPage }),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
];
