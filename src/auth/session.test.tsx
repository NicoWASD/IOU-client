import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { tokenStore } from './tokenStore';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => {
  tokenStore.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

it('anónimo en /grupos → redirige a /ingresar recordando el origen (CA-05.1)', async () => {
  mockApi({});
  const { router } = renderApp('/grupos');
  await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
  expect(router.state.location.state).toEqual({ from: '/grupos' });
});

it('con token válido sigue logueado al recargar (CA-03.1)', async () => {
  tokenStore.set('t-valido');
  const fetchMock = mockApi({ 'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }) });
  renderApp('/grupos');
  expect(await screen.findByRole('heading', { name: 'Mis grupos' })).toBeInTheDocument();
  expect(screen.getByText('Sofía')).toBeInTheDocument();
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  expect(new Headers(init.headers).get('Authorization')).toBe('Bearer t-valido');
});

it('token vencido → borra el token y va al login con aviso (CA-03.2)', async () => {
  tokenStore.set('t-viejo');
  mockApi({
    'GET /auth/me': () =>
      jsonResponse(
        { error: { code: 'TOKEN_EXPIRADO', message: 'Tu sesión expiró. Ingresá de nuevo.' } },
        401,
      ),
  });
  const { router } = renderApp('/grupos');
  await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
  expect(router.state.location.search).toBe('?sesion=expirada');
  expect(tokenStore.get()).toBeNull();
});

it('cerrar sesión borra el token y vuelve al login (CA-04.1)', async () => {
  tokenStore.set('t-valido');
  mockApi({ 'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }) });
  const { router } = renderApp('/grupos');
  await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
  expect(tokenStore.get()).toBeNull();
  await router.navigate('/grupos');
  await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
});

it('sin conexión al validar la sesión → error con Reintentar, sin perder el token', async () => {
  tokenStore.set('t-valido');
  mockApi({ 'GET /auth/me': () => Promise.reject(new TypeError('Failed to fetch')) });
  renderApp('/grupos');
  expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  expect(tokenStore.get()).toBe('t-valido');
});
