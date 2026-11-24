import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/auth/AuthProvider';
import { authEvents } from '@/auth/events';
import { RequireAuth } from '@/auth/RequireAuth';
import { tokenStore } from '@/auth/tokenStore';
import { grupoBariloche, grupoDepto, listaGrupos, tomi } from '@/test/fixtures/h2';
import { jsonResponse, mockApi, usuarioDemo } from '@/test/utils';
import {
  useAgregarMiembro,
  useCrearGrupo,
  useEditarGrupo,
  useGrupo,
  useGrupos,
  useMiembros,
  useQuitarMiembro,
} from './grupos';

beforeEach(() => tokenStore.set('t-valido'));
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const llamada = (fetchMock: ReturnType<typeof mockApi>, i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as unknown as [string, RequestInit];
  return {
    metodo: init.method,
    path: new URL(url).pathname,
    auth: new Headers(init.headers).get('Authorization'),
    body: init.body ? (JSON.parse(String(init.body)) as unknown) : undefined,
  };
};

/** Siembra la caché como si el usuario ya hubiera visto la lista, el detalle y los miembros. */
function sembrar(queryClient: QueryClient) {
  queryClient.setQueryData(['grupos'], listaGrupos);
  queryClient.setQueryData(['grupos', 'g1'], grupoBariloche);
  queryClient.setQueryData(['grupos', 'g1', 'miembros'], grupoBariloche.miembros);
  queryClient.setQueryData(['grupos', 'g2'], grupoDepto);
}
const invalidada = (queryClient: QueryClient, key: unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated;

describe('consultas', () => {
  it('useGrupos → GET /api/grupos con el token del tokenStore', async () => {
    const fetchMock = mockApi({ 'GET /grupos': () => jsonResponse({ grupos: listaGrupos }) });
    const { wrapper } = setup();
    const { result } = renderHook(() => useGrupos(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(listaGrupos));
    expect(llamada(fetchMock)).toMatchObject({
      metodo: 'GET',
      path: '/api/grupos',
      auth: 'Bearer t-valido',
    });
  });

  it('useGrupo(id) → GET /api/grupos/:id', async () => {
    const fetchMock = mockApi({ 'GET /grupos/g1': () => jsonResponse({ grupo: grupoBariloche }) });
    const { wrapper } = setup();
    const { result } = renderHook(() => useGrupo('g1'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(grupoBariloche));
    expect(llamada(fetchMock).path).toBe('/api/grupos/g1');
  });

  it('useMiembros(id) → GET /api/grupos/:id/miembros', async () => {
    const fetchMock = mockApi({
      'GET /grupos/g1/miembros': () => jsonResponse({ miembros: grupoBariloche.miembros }),
    });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMiembros('g1'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(grupoBariloche.miembros));
    expect(llamada(fetchMock).path).toBe('/api/grupos/g1/miembros');
  });
});

describe('mutaciones (Review Focus 5)', () => {
  it('useCrearGrupo → POST /api/grupos e invalida la lista', async () => {
    const fetchMock = mockApi({
      'POST /grupos': () => jsonResponse({ grupo: grupoBariloche }, 201),
    });
    const { queryClient, wrapper } = setup();
    sembrar(queryClient);
    const { result } = renderHook(() => useCrearGrupo(), { wrapper });
    const grupo = await result.current.mutateAsync({ nombre: 'Bariloche 2026' });
    expect(grupo).toEqual(grupoBariloche);
    expect(llamada(fetchMock)).toMatchObject({
      metodo: 'POST',
      path: '/api/grupos',
      body: { nombre: 'Bariloche 2026' },
    });
    expect(invalidada(queryClient, ['grupos'])).toBe(true);
    // El detalle del grupo nuevo queda en caché: la navegación no muestra esqueleto
    expect(queryClient.getQueryData(['grupos', 'g1'])).toEqual(grupoBariloche);
  });

  it('useEditarGrupo → PATCH /api/grupos/:id, actualiza el detalle e invalida la lista', async () => {
    const editado = { ...grupoBariloche, nombre: 'Bariloche 2027' };
    const fetchMock = mockApi({ 'PATCH /grupos/g1': () => jsonResponse({ grupo: editado }) });
    const { queryClient, wrapper } = setup();
    sembrar(queryClient);
    const { result } = renderHook(() => useEditarGrupo('g1'), { wrapper });
    await result.current.mutateAsync({ nombre: 'Bariloche 2027', descripcion: null });
    expect(llamada(fetchMock)).toMatchObject({
      metodo: 'PATCH',
      path: '/api/grupos/g1',
      body: { nombre: 'Bariloche 2027', descripcion: null },
    });
    expect(queryClient.getQueryData(['grupos', 'g1'])).toMatchObject({ nombre: 'Bariloche 2027' });
    expect(invalidada(queryClient, ['grupos'])).toBe(true);
    expect(invalidada(queryClient, ['grupos', 'g1'])).toBe(true);
  });

  it('useAgregarMiembro → POST /api/grupos/:id/miembros e invalida miembros, grupo y lista', async () => {
    const fetchMock = mockApi({
      'POST /grupos/g1/miembros': () => jsonResponse({ miembro: tomi }, 201),
    });
    const { queryClient, wrapper } = setup();
    sembrar(queryClient);
    const { result } = renderHook(() => useAgregarMiembro('g1'), { wrapper });
    const miembro = await result.current.mutateAsync('tomi@mail.com');
    expect(miembro).toEqual(tomi);
    expect(llamada(fetchMock)).toMatchObject({
      metodo: 'POST',
      path: '/api/grupos/g1/miembros',
      body: { email: 'tomi@mail.com' },
    });
    expect(invalidada(queryClient, ['grupos', 'g1', 'miembros'])).toBe(true);
    expect(invalidada(queryClient, ['grupos', 'g1'])).toBe(true);
    expect(invalidada(queryClient, ['grupos'])).toBe(true);
    // No toca el detalle de otro grupo
    expect(invalidada(queryClient, ['grupos', 'g2'])).toBe(false);
  });

  it('useQuitarMiembro → DELETE /api/grupos/:id/miembros/:usuarioId (204) e invalida', async () => {
    const fetchMock = mockApi({
      'DELETE /grupos/g1/miembros/u2': () => new Response(null, { status: 204 }),
    });
    const { queryClient, wrapper } = setup();
    sembrar(queryClient);
    const { result } = renderHook(() => useQuitarMiembro('g1'), { wrapper });
    await result.current.mutateAsync('u2');
    expect(llamada(fetchMock)).toMatchObject({
      metodo: 'DELETE',
      path: '/api/grupos/g1/miembros/u2',
    });
    expect(invalidada(queryClient, ['grupos', 'g1', 'miembros'])).toBe(true);
    expect(invalidada(queryClient, ['grupos', 'g1'])).toBe(true);
    expect(invalidada(queryClient, ['grupos'])).toBe(true);
    expect(invalidada(queryClient, ['grupos', 'g2'])).toBe(false);
  });

  it.each([
    ['MIEMBRO_NO_ENCONTRADO', 404],
    ['GRUPO_NO_ENCONTRADO', 404],
    ['SOLO_ADMIN', 403],
    ['GRUPO_ARCHIVADO', 409],
  ])('un error de estado (%s) invalida miembros, grupo y lista', async (code, status) => {
    mockApi({
      'DELETE /grupos/g1/miembros/u2': () =>
        jsonResponse({ error: { code, message: 'x' } }, status),
      'POST /grupos/g1/miembros': () => jsonResponse({ error: { code, message: 'x' } }, status),
    });
    const { queryClient, wrapper } = setup();
    sembrar(queryClient);
    const quitar = renderHook(() => useQuitarMiembro('g1'), { wrapper });
    await expect(quitar.result.current.mutateAsync('u2')).rejects.toMatchObject({ code });
    expect(invalidada(queryClient, ['grupos', 'g1', 'miembros'])).toBe(true);
    expect(invalidada(queryClient, ['grupos'])).toBe(true);
    sembrar(queryClient);
    const agregar = renderHook(() => useAgregarMiembro('g1'), { wrapper });
    await expect(agregar.result.current.mutateAsync('x@mail.com')).rejects.toMatchObject({ code });
    expect(invalidada(queryClient, ['grupos', 'g1', 'miembros'])).toBe(true);
  });

  it('una mutación que falla no invalida nada y expone el ApiError', async () => {
    mockApi({
      'DELETE /grupos/g1/miembros/u2': () =>
        jsonResponse(
          {
            error: {
              code: 'SALDO_PENDIENTE',
              message: 'No se puede quitar: tiene saldo pendiente de $ 3.200',
              details: { saldo: '-3200.00' },
            },
          },
          409,
        ),
    });
    const { queryClient, wrapper } = setup();
    sembrar(queryClient);
    const { result } = renderHook(() => useQuitarMiembro('g1'), { wrapper });
    await expect(result.current.mutateAsync('u2')).rejects.toMatchObject({
      status: 409,
      code: 'SALDO_PENDIENTE',
      details: { saldo: '-3200.00' },
    });
    expect(invalidada(queryClient, ['grupos', 'g1', 'miembros'])).toBe(false);
  });
});

describe('sesión inválida en una consulta', () => {
  function Consumidor() {
    const grupos = useGrupos();
    return <p>{grupos.isSuccess ? 'grupos cargados' : 'cargando'}</p>;
  }

  function renderProtegido() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [
        {
          element: (
            <AuthProvider>
              <Outlet />
            </AuthProvider>
          ),
          children: [
            { path: '/ingresar', element: <p>login</p> },
            { element: <RequireAuth />, children: [{ path: '/x', element: <Consumidor /> }] },
          ],
        },
      ],
      { initialEntries: ['/x'] },
    );
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    return { router, queryClient };
  }

  it.each(['TOKEN_EXPIRADO', 'TOKEN_INVALIDO'])(
    '401 %s en GET /grupos → borra el token y va a /ingresar?sesion=expirada',
    async (code) => {
      mockApi({
        'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }),
        'GET /grupos': () =>
          jsonResponse({ error: { code, message: 'Tu sesión expiró. Ingresá de nuevo.' } }, 401),
      });
      const { router } = renderProtegido();
      await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
      expect(router.state.location.search).toBe('?sesion=expirada');
      expect(tokenStore.get()).toBeNull();
      expect(screen.getByText('login')).toBeInTheDocument();
    },
  );

  it('el aviso del bus con el token actual cierra la sesión y borra los grupos de la caché', async () => {
    mockApi({
      'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }),
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
    });
    const { router, queryClient } = renderProtegido();
    expect(await screen.findByText('grupos cargados')).toBeInTheDocument();
    act(() => authEvents.emitSesionInvalida('t-valido'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
    expect(queryClient.getQueryData(['grupos'])).toBeUndefined();
  });

  it('un 401 de un pedido hecho con un token viejo no cierra la sesión nueva', async () => {
    mockApi({
      'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }),
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
    });
    const { router } = renderProtegido();
    expect(await screen.findByText('grupos cargados')).toBeInTheDocument();
    act(() => authEvents.emitSesionInvalida('t-viejo'));
    expect(router.state.location.pathname).toBe('/x');
    expect(tokenStore.get()).toBe('t-valido');
  });
});
