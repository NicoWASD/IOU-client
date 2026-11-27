import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/auth/tokenStore';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.set('t-valido'));
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
  document.documentElement.classList.remove('dark', 'light');
  sessionStorage.clear();
});

const perfil = {
  ...usuarioDemo,
  usuario: 'sofi',
  nombreReal: 'Sofía',
  apellido: null,
  tutorialVisto: true,
};
const cuerpo = (fetchMock: ReturnType<typeof mockApi>, metodo: string) =>
  JSON.parse(String(fetchMock.mock.calls.find(([, i]) => i?.method === metodo)?.[1]?.body));

describe('Configuración (HU-35, HU-36)', () => {
  it('el tema oscuro pone .dark en <html>; agregar un medio lo guarda con PUT', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': () => jsonResponse({ usuario: perfil }),
      'GET /invitaciones': () => jsonResponse({ invitaciones: [] }),
      'GET /me/medios': () => jsonResponse({ medios: [] }),
      'PUT /me/medios': (init) => jsonResponse(JSON.parse(String(init?.body))),
    });
    renderApp('/configuracion');
    await userEvent.click(await screen.findByRole('radio', { name: 'Oscuro' }));
    expect(document.documentElement).toHaveClass('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Agregar medio' }));
    await userEvent.type(screen.getByLabelText('Alias, CVU o usuario'), 'sofi.mp');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar medios' }));
    await waitFor(() =>
      expect(cuerpo(fetchMock, 'PUT')).toEqual({
        medios: [{ plataforma: 'MERCADO_PAGO', valor: 'sofi.mp', nota: null }],
      }),
    );
  });
});

describe('Guía de primer uso (HU-38)', () => {
  // jsdom no calcula layout: el objetivo tiene que tener tamaño para que se dibuje el recorte
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 10, y: 10, width: 120, height: 44 }),
    );
  });
  afterEach(() => vi.restoreAllMocks());
  const mocks = () =>
    mockApi({
      'GET /auth/me': () => jsonResponse({ usuario: { ...perfil, tutorialVisto: false } }),
      'GET /invitaciones': () => jsonResponse({ invitaciones: [] }),
      'GET /grupos': () => jsonResponse({ grupos: [] }),
      'PATCH /auth/me': () => jsonResponse({ usuario: perfil }),
    });

  it('arranca en "Crear grupo" y avanza cuando el usuario lo toca', async () => {
    mocks();
    renderApp('/grupos');
    expect(await screen.findByText(/Ticky/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '¡Dale!' }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear un grupo' }));
    expect(await screen.findByText(/Ponele un nombre/)).toBeInTheDocument();
  });

  it('"Saltar guía" la cierra y guarda tutorialVisto', async () => {
    const fetchMock = mocks();
    renderApp('/grupos');
    await userEvent.click(await screen.findByRole('button', { name: 'Saltar guía' }));
    await waitFor(() => expect(cuerpo(fetchMock, 'PATCH')).toEqual({ tutorialVisto: true }));
    expect(screen.queryByText(/el ticket de IOU/)).not.toBeInTheDocument();
  });
});
