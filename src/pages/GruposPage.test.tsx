import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/auth/tokenStore';
import { grupoBariloche, listaGrupos } from '@/test/fixtures/h2';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.set('t-valido'));
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const me = () => jsonResponse({ usuario: usuarioDemo });
const llamadasA = (fetchMock: ReturnType<typeof mockApi>, metodo: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === metodo);

describe('Mis grupos', () => {
  it('con 2 grupos se ven 2 tarjetas con sus miembros y el balance (CA-07.1)', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos.slice(0, 2) }),
    });
    renderApp('/grupos');
    const lista = await screen.findByRole('list', { name: 'Tus grupos' });
    const tarjetas = within(lista).getAllByRole('listitem');
    expect(tarjetas).toHaveLength(2);
    const bariloche = within(lista).getByRole('link', { name: /Bariloche 2026/ });
    expect(bariloche).toHaveAttribute('href', '/grupos/g1');
    expect(within(bariloche).getByText('Están a mano')).toBeInTheDocument();
    expect(within(bariloche).getByText('3 miembros')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Archivados' })).not.toBeInTheDocument();
  });

  it('vacío → la invitación y el botón activo, que abre el diálogo (CA-07.2)', async () => {
    mockApi({ 'GET /auth/me': me, 'GET /grupos': () => jsonResponse({ grupos: [] }) });
    renderApp('/grupos');
    expect(
      await screen.findByText(
        'Todavía no tenés grupos. Armá uno para el viaje, el depto o el asado.',
      ),
    ).toBeInTheDocument();
    const boton = screen.getByRole('button', { name: 'Crear un grupo' });
    expect(boton).toBeEnabled();
    await userEvent.click(boton);
    expect(await screen.findByRole('dialog', { name: 'Crear grupo' })).toBeInTheDocument();
  });

  it('el grupo archivado aparece en "Archivados" y no entre los activos (CA-07.3)', async () => {
    mockApi({ 'GET /auth/me': me, 'GET /grupos': () => jsonResponse({ grupos: listaGrupos }) });
    renderApp('/grupos');
    const archivados = await screen.findByRole('region', { name: 'Archivados' });
    expect(within(archivados).getByRole('link', { name: /Asado del sábado/ })).toBeInTheDocument();
    const activos = screen.getByRole('list', { name: 'Tus grupos' });
    expect(within(activos).queryByText('Asado del sábado')).not.toBeInTheDocument();
    expect(within(activos).getAllByRole('listitem')).toHaveLength(2);
  });

  it('error de red → aviso con "Reintentar", que vuelve a pedir la lista', async () => {
    let falla = true;
    mockApi({
      'GET /auth/me': me,
      'GET /grupos': () =>
        falla
          ? Promise.reject(new TypeError('Failed to fetch'))
          : jsonResponse({ grupos: listaGrupos.slice(0, 1) }),
    });
    renderApp('/grupos');
    const alerta = await screen.findByRole('alert');
    expect(within(alerta).getByText('No hay conexión con el servidor')).toBeInTheDocument();
    falla = false;
    await userEvent.click(within(alerta).getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('link', { name: /Bariloche 2026/ })).toBeInTheDocument();
  });

  it('mientras carga, la lista está marcada como ocupada para lectores de pantalla', async () => {
    mockApi({ 'GET /auth/me': me, 'GET /grupos': () => new Promise<Response>(() => {}) });
    renderApp('/grupos');
    await screen.findByRole('heading', { name: 'Mis grupos' });
    expect(screen.getByText('Cargando tus grupos').closest('[aria-busy="true"]')).not.toBeNull();
  });
});

describe('Crear grupo', () => {
  async function abrirDialogo() {
    await userEvent.click(await screen.findByRole('button', { name: 'Crear grupo' }));
    return screen.findByRole('dialog', { name: 'Crear grupo' });
  }

  it('nombre vacío → error en el campo, sin llamar a la API (CA-06.2)', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
    });
    renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), '   ');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    const nombre = within(dialogo).getByLabelText('Nombre');
    expect(await within(dialogo).findByText('Poné un nombre de hasta 60 caracteres')).toBeVisible();
    expect(nombre).toHaveAttribute('aria-invalid', 'true');
    expect(llamadasA(fetchMock, 'POST')).toHaveLength(0);
  });

  it('nombre de más de 60 caracteres → error en el campo', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
    });
    renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), 'x'.repeat(61));
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    expect(await within(dialogo).findByText('Poné un nombre de hasta 60 caracteres')).toBeVisible();
    expect(llamadasA(fetchMock, 'POST')).toHaveLength(0);
  });

  it('crear bien → navega al detalle y avisa "Grupo creado" (CA-06.1)', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
      'POST /grupos': () => jsonResponse({ grupo: grupoBariloche }, 201),
      'GET /grupos/g1': () => jsonResponse({ grupo: grupoBariloche }),
      'GET /grupos/g1/miembros': () => jsonResponse({ miembros: grupoBariloche.miembros }),
    });
    const { router } = renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), '  Bariloche 2026 ');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos/g1'));
    expect(await screen.findByText('Grupo creado')).toBeInTheDocument();
    const [post] = llamadasA(fetchMock, 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ nombre: 'Bariloche 2026' });
  });

  it('con descripción → la manda recortada', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
      'POST /grupos': () => jsonResponse({ grupo: grupoBariloche }, 201),
      'GET /grupos/g1': () => jsonResponse({ grupo: grupoBariloche }),
      'GET /grupos/g1/miembros': () => jsonResponse({ miembros: grupoBariloche.miembros }),
    });
    const { router } = renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), 'Bariloche 2026');
    await userEvent.type(
      within(dialogo).getByLabelText('Descripción (opcional)'),
      ' El viaje de invierno ',
    );
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos/g1'));
    const [post] = llamadasA(fetchMock, 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      nombre: 'Bariloche 2026',
      descripcion: 'El viaje de invierno',
    });
  });

  it('mientras crea, el botón queda deshabilitado y dice "Creando grupo…"', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
      'POST /grupos': () => new Promise<Response>(() => {}),
    });
    renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), 'Bariloche 2026');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    expect(await within(dialogo).findByRole('button', { name: 'Creando grupo…' })).toBeDisabled();
  });

  it('un error de la API se muestra en el diálogo y deja reintentar', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
      'POST /grupos': () => Promise.reject(new TypeError('Failed to fetch')),
    });
    renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), 'Bariloche 2026');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'No hay conexión con el servidor',
    );
    expect(within(dialogo).getByRole('button', { name: 'Crear grupo' })).toBeEnabled();
  });

  it('un 400 del back marca el campo con el mensaje de details', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
      'POST /grupos': () =>
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Revisá los datos',
              details: { nombre: 'Poné un nombre de hasta 60 caracteres' },
            },
          },
          400,
        ),
    });
    renderApp('/grupos');
    const dialogo = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText('Nombre'), 'Bariloche 2026');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Crear grupo' }));
    expect(await within(dialogo).findByText('Poné un nombre de hasta 60 caracteres')).toBeVisible();
    expect(within(dialogo).getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
  });
});
