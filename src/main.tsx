import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { esErrorDelCliente } from '@/api/client';
import { routes } from './router';
import './index.css';

// Un reintento: cubre un corte de red puntual sin demorar de más el error.
// Un 4xx (404, 403...) no se reintenta: la respuesta no va a cambiar.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: (fallos, err) => !esErrorDelCliente(err) && fallos < 1 },
  },
});
const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
