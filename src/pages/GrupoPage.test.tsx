import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GrupoDetalle } from '@/api/types';
import { tokenStore } from '@/auth/tokenStore';
import { grupoBariloche, grupoDepto, listaGrupos } from '@/test/fixtures/h2';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.set('t-valido'));
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const me = () => jsonResponse({ usuario: usuarioDemo });

function mockGrupo(grupo: GrupoDetalle, extra: Parameters<typeof mockApi>[0] = {}) {
  return mockApi({
    'GET /auth/me': me,
    [`GET /grupos/${grupo.id}`]: () => jsonResponse({ grupo }),
    [`GET /grupos/${grupo.id}/miembros`]: () => jsonResponse({ miembros: grupo.miembros }),
    [`GET /grupos/${grupo.id}/gastos`]: () =>
      jsonResponse({ gastos: [], page: 1, pageSize: 20, total: 0 }),
    [`GET /grupos/${grupo.id}/balances`]: () =>
      jsonResponse({
        balances: [
          { usuario: { id: 'u1', nombre: 'Sofía' }, balance: '200.00' },
          { usuario: { id: 'u2', nombre: 'Tomi' }, balance: '-200.00' },
        ],
      }),
    [`GET /grupos/${grupo.id}/liquidacion`]: () =>
      jsonResponse({
        transferencias: [
          { de: { id: 'u2', nombre: 'Tomi' }, a: { id: 'u1', nombre: 'Sofía' }, monto: '200.00' },
        ],
      }),
    [`GET /grupos/${grupo.id}/pagos`]: () => jsonResponse({ pagos: [] }),
    ...extra,
  });
}

describe('Detalle del grupo', () => {
  it('muestra el nombre, los miembros activos y las pestañas (CA-08.1)', async () => {
    mockGrupo(grupoBariloche);
    renderApp('/grupos/g1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Bariloche 2026' })).toBeVisible();
    expect(screen.getByText('El viaje de invierno')).toBeInTheDocument();
    expect(screen.getByText('Sofía, Tomi y Juli')).toBeInTheDocument();
    expect(screen.getByText('3 miembros')).toBeInTheDocument();
    const pestañas = within(screen.getByRole('tablist', { name: 'Secciones del grupo' }));
    expect(pestañas.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Gastos',
      'Balances',
      'Pagos',
      'Miembros',
    ]);
    expect(pestañas.getByRole('tab', { name: 'Gastos' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Gastos vacía, Balances con la liquidación (CA-19.3, CA-21.1) y Pagos vacía', async () => {
    mockGrupo(grupoBariloche);
    const { router } = renderApp('/grupos/g1');
    expect(await screen.findByText(/Sin gastos todavía/)).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Balances' }));
    const panel = await screen.findByRole('tabpanel');
    expect(await within(panel).findByText('Tomi → Vos')).toBeVisible();
    expect(panel).toHaveTextContent('Le deben');
    expect(panel).toHaveTextContent('Debe');
    await userEvent.click(screen.getByRole('tab', { name: 'Pagos' }));
    expect(screen.getByRole('tab', { name: 'Pagos' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText(/Cuando alguien salde una deuda/)).toBeVisible();
    expect(router.state.location.search).toBe('?tab=pagos');
  });

  it('la pestaña activa sale de la URL (?tab=miembros)', async () => {
    mockGrupo(grupoBariloche);
    renderApp('/grupos/g1?tab=miembros');
    const tab = await screen.findByRole('tab', { name: 'Miembros' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(await within(screen.getByRole('tabpanel')).findByText('tomi@mail.com')).toBeVisible();
  });

  it('una pestaña inválida en la URL cae en Gastos', async () => {
    mockGrupo(grupoBariloche);
    renderApp('/grupos/g1?tab=cualquiera');
    expect(await screen.findByRole('tab', { name: 'Gastos' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('el panel "Cómo están las cuentas" avisa que llega con los gastos', async () => {
    mockGrupo(grupoBariloche);
    renderApp('/grupos/g1');
    const panel = await screen.findByRole('complementary', { name: 'Cómo están las cuentas' });
    expect(panel).toHaveTextContent('Disponible cuando cargues gastos');
  });

  it('404 → "Este grupo no existe o no sos parte" y "Ir a mis grupos" (CA-08.2)', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos/g9': () =>
        jsonResponse(
          {
            error: { code: 'GRUPO_NO_ENCONTRADO', message: 'Este grupo no existe o no sos parte' },
          },
          404,
        ),
      'GET /grupos': () => jsonResponse({ grupos: listaGrupos }),
    });
    const { router } = renderApp('/grupos/g9');
    expect(
      await screen.findByRole('heading', { name: 'Este grupo no existe o no sos parte' }),
    ).toBeVisible();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Ir a mis grupos' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos'));
  });

  it('un id mal formado (400) se ve igual que un 404', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos/abc': () =>
        jsonResponse({ error: { code: 'VALIDATION_ERROR', message: 'Revisá los datos' } }, 400),
    });
    renderApp('/grupos/abc');
    expect(
      await screen.findByRole('heading', { name: 'Este grupo no existe o no sos parte' }),
    ).toBeVisible();
  });

  it('al entrar, el foco va al h1 con el nombre del grupo', async () => {
    mockGrupo(grupoBariloche);
    renderApp('/grupos/g1');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Bariloche 2026' });
    expect(h1).toHaveFocus();
  });

  it('en mobile, la franja fija de las pestañas muestra el nombre del grupo', async () => {
    mockGrupo(grupoBariloche);
    renderApp('/grupos/g1');
    const franja = await screen.findByTestId('franja-pestanas');
    expect(within(franja).getByText('Bariloche 2026')).toBeInTheDocument();
  });

  it('mientras carga, el contenedor está ocupado con "Cargando el grupo"', async () => {
    mockApi({ 'GET /auth/me': me, 'GET /grupos/g1': () => new Promise<Response>(() => {}) });
    renderApp('/grupos/g1');
    const texto = await screen.findByText('Cargando el grupo');
    expect(texto.closest('[aria-busy="true"]')).not.toBeNull();
  });

  it('si un refetch responde 404 (me quitaron del grupo), deja de mostrar el grupo en caché', async () => {
    let quitado = false;
    mockGrupo(grupoBariloche, {
      'GET /grupos/g1': () =>
        quitado
          ? jsonResponse(
              {
                error: {
                  code: 'GRUPO_NO_ENCONTRADO',
                  message: 'Este grupo no existe o no sos parte',
                },
              },
              404,
            )
          : jsonResponse({ grupo: grupoBariloche }),
    });
    const { queryClient } = renderApp('/grupos/g1');
    await screen.findByRole('heading', { level: 1, name: 'Bariloche 2026' });
    quitado = true;
    await queryClient.refetchQueries({ queryKey: ['grupos', 'g1'], exact: true });
    expect(await screen.findByText('Este grupo no existe o no sos parte')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Bariloche 2026' }),
    ).not.toBeInTheDocument();
    expect(queryClient.getQueryData(['grupos', 'g1'])).toBeUndefined();
  });

  it('si falla un refetch con datos ya cargados, la pantalla sigue mostrando el grupo', async () => {
    let falla = false;
    mockGrupo(grupoBariloche, {
      'GET /grupos/g1': () =>
        falla
          ? Promise.reject(new TypeError('Failed to fetch'))
          : jsonResponse({ grupo: grupoBariloche }),
    });
    const { queryClient } = renderApp('/grupos/g1');
    await screen.findByRole('heading', { level: 1, name: 'Bariloche 2026' });
    falla = true;
    await queryClient.refetchQueries({ queryKey: ['grupos', 'g1'], exact: true });
    await waitFor(() => expect(queryClient.getQueryState(['grupos', 'g1'])?.status).toBe('error'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Bariloche 2026' })).toBeVisible();
  });

  it('error de red → "Reintentar"', async () => {
    mockApi({
      'GET /auth/me': me,
      'GET /grupos/g1': () => Promise.reject(new TypeError('Failed to fetch')),
    });
    renderApp('/grupos/g1');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('No hay conexión con el servidor');
    expect(within(alerta).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});

describe('Editar grupo', () => {
  it('un admin ve "Editar grupo" (CA-09.1) y un miembro no (CA-09.2)', async () => {
    mockGrupo(grupoBariloche);
    const { unmount } = renderApp('/grupos/g1');
    expect(await screen.findByRole('button', { name: 'Editar grupo' })).toBeInTheDocument();
    unmount();

    mockGrupo(grupoDepto);
    renderApp('/grupos/g2');
    await screen.findByRole('heading', { level: 1, name: 'Depto Palermo' });
    expect(screen.queryByRole('button', { name: 'Editar grupo' })).not.toBeInTheDocument();
  });

  it('en un grupo archivado nadie ve "Editar grupo" y se avisa que es solo de consulta', async () => {
    mockGrupo({ ...grupoBariloche, archivado: true });
    renderApp('/grupos/g1');
    await screen.findByRole('heading', { level: 1, name: 'Bariloche 2026' });
    expect(screen.queryByRole('button', { name: 'Editar grupo' })).not.toBeInTheDocument();
    expect(screen.getByText('El grupo está archivado: solo se puede consultar')).toBeVisible();
  });

  it('editar actualiza el título sin recargar y avisa "Grupo actualizado" (Review Focus 5)', async () => {
    let actual: GrupoDetalle = grupoBariloche;
    const fetchMock = mockApi({
      'GET /auth/me': me,
      'GET /grupos/g1': () => jsonResponse({ grupo: actual }),
      'GET /grupos/g1/miembros': () => jsonResponse({ miembros: actual.miembros }),
      'GET /grupos': () => jsonResponse({ grupos: [{ ...listaGrupos[0], nombre: actual.nombre }] }),
      'PATCH /grupos/g1': (init) => {
        const body = JSON.parse(String(init?.body)) as { nombre: string; descripcion: string };
        actual = { ...actual, nombre: body.nombre, descripcion: body.descripcion || null };
        return jsonResponse({ grupo: actual });
      },
    });
    const { router } = renderApp('/grupos/g1');
    await userEvent.click(await screen.findByRole('button', { name: 'Editar grupo' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Editar grupo' });
    const nombre = within(dialogo).getByLabelText('Nombre');
    expect(nombre).toHaveValue('Bariloche 2026');
    expect(within(dialogo).getByLabelText('Descripción (opcional)')).toHaveValue(
      'El viaje de invierno',
    );
    await userEvent.clear(nombre);
    await userEvent.type(nombre, 'Bariloche 2027');
    await userEvent.clear(within(dialogo).getByLabelText('Descripción (opcional)'));
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bariloche 2027' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Grupo actualizado')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Editar grupo' })).not.toBeInTheDocument();
    expect(screen.queryByText('El viaje de invierno')).not.toBeInTheDocument();
    // La lista de Mis grupos también ve el nombre nuevo (Review Focus 5)
    await router.navigate('/grupos');
    expect(await screen.findByRole('link', { name: /Bariloche 2027/ })).toBeInTheDocument();
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({
      nombre: 'Bariloche 2027',
      descripcion: '',
    });
  });

  it('si la API rechaza la edición, el mensaje queda en el diálogo', async () => {
    mockGrupo(grupoBariloche, {
      'PATCH /grupos/g1': () =>
        jsonResponse(
          {
            error: {
              code: 'GRUPO_ARCHIVADO',
              message: 'El grupo está archivado: solo se puede consultar',
            },
          },
          409,
        ),
    });
    renderApp('/grupos/g1');
    await userEvent.click(await screen.findByRole('button', { name: 'Editar grupo' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Editar grupo' });
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'El grupo está archivado: solo se puede consultar',
    );
  });
});
