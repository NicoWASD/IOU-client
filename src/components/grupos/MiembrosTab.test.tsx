import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GrupoDetalle, Miembro } from '@/api/types';
import { tokenStore } from '@/auth/tokenStore';
import { grupoBariloche, grupoDepto } from '@/test/fixtures/h2';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.set('t-valido'));
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const lu: Miembro = { id: 'u5', nombre: 'Lu', email: 'lu@mail.com', rol: 'MIEMBRO', activo: true };
const error = (code: string, message: string, status: number, details?: object) =>
  jsonResponse({ error: { code, message, ...(details ? { details } : {}) } }, status);

/** Grupo con miembros mutables: los handlers de alta y baja cambian lo que devuelve el GET. */
function mockMiembros(grupo: GrupoDetalle, extra: Parameters<typeof mockApi>[0] = {}) {
  const estado = { miembros: [...grupo.miembros] };
  const fetchMock = mockApi({
    'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }),
    [`GET /grupos/${grupo.id}`]: () => jsonResponse({ grupo: { ...grupo, ...estado } }),
    [`GET /grupos/${grupo.id}/miembros`]: () => jsonResponse({ miembros: estado.miembros }),
    ...extra,
  });
  return { fetchMock, estado };
}

const abrir = (grupo: GrupoDetalle) => renderApp(`/grupos/${grupo.id}?tab=miembros`);
const panel = () => screen.findByRole('tabpanel', { name: 'Miembros' });

describe('Lista de miembros', () => {
  it('muestra avatar, nombre, email y rol; los inactivos van en "Ya no participan"', async () => {
    mockMiembros(grupoBariloche);
    abrir(grupoBariloche);
    const p = await panel();
    const activos = within(p).getByRole('list', { name: 'Participan' });
    expect(within(activos).getAllByRole('listitem')).toHaveLength(3);
    expect(within(activos).getByText('tomi@mail.com')).toBeVisible();
    expect(within(activos).getByText('Admin')).toBeVisible();
    expect(within(activos).getByText('Sofía (vos)')).toBeVisible();
    const inactivos = within(p).getByRole('list', { name: 'Ya no participan' });
    expect(within(inactivos).getByText('Caro')).toHaveClass('text-pencil');
  });
});

describe('Agregar por email (admin)', () => {
  it('agrega, limpia el campo y avisa "Lu se sumó al grupo" (CA-10.1)', async () => {
    const { fetchMock, estado } = mockMiembros(grupoBariloche, {
      'POST /grupos/g1/miembros': () => {
        estado.miembros = [...estado.miembros, lu];
        return jsonResponse({ miembro: lu }, 201);
      },
    });
    abrir(grupoBariloche);
    const p = await panel();
    const campo = within(p).getByLabelText('Agregar por email');
    await userEvent.type(campo, '  lu@mail.com ');
    await userEvent.click(within(p).getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByText('Lu se sumó al grupo')).toBeInTheDocument();
    expect(campo).toHaveValue('');
    expect(await within(p).findByText('lu@mail.com')).toBeVisible();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ email: 'lu@mail.com' });
  });

  it.each([
    ['USUARIO_NO_ENCONTRADO', 'No existe un usuario con ese email', 404, 'CA-10.2'],
    ['YA_ES_MIEMBRO', 'Ya es miembro del grupo', 409, 'CA-10.3'],
  ])('%s → el mensaje debajo del campo (%s)', async (code, message, status) => {
    mockMiembros(grupoBariloche, {
      'POST /grupos/g1/miembros': () => error(code, message, status),
    });
    abrir(grupoBariloche);
    const p = await panel();
    const campo = within(p).getByLabelText('Agregar por email');
    await userEvent.type(campo, 'tomi@mail.com');
    await userEvent.click(within(p).getByRole('button', { name: 'Agregar' }));
    const msg = await within(p).findByText(message);
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo.getAttribute('aria-describedby')).toContain(msg.id);
    expect(campo).toHaveValue('tomi@mail.com');
  });

  it('email vacío o inválido → error en el campo, sin llamar a la API', async () => {
    const { fetchMock } = mockMiembros(grupoBariloche);
    abrir(grupoBariloche);
    const p = await panel();
    await userEvent.click(within(p).getByRole('button', { name: 'Agregar' }));
    expect(await within(p).findByText('Ingresá el email de la persona')).toBeVisible();
    await userEvent.type(within(p).getByLabelText('Agregar por email'), 'tomi@');
    await userEvent.click(within(p).getByRole('button', { name: 'Agregar' }));
    expect(await within(p).findByText('El email no es válido.')).toBeVisible();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });
});

describe('Quitar del grupo (admin)', () => {
  it('pide confirmación y pasa a "Ya no participan" (CA-11.1)', async () => {
    const { fetchMock, estado } = mockMiembros(grupoBariloche, {
      'DELETE /grupos/g1/miembros/u2': () => {
        estado.miembros = estado.miembros.map((m) => (m.id === 'u2' ? { ...m, activo: false } : m));
        return new Response(null, { status: 204 });
      },
    });
    abrir(grupoBariloche);
    const p = await panel();
    await userEvent.click(within(p).getByRole('button', { name: 'Quitar a Tomi' }));
    const dialogo = await screen.findByRole('alertdialog', { name: '¿Quitar a Tomi del grupo?' });
    const confirmar = within(dialogo).getByRole('button', { name: 'Quitar del grupo' });
    expect(confirmar).toHaveClass('bg-destructive');
    await userEvent.click(confirmar);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    const inactivos = await within(p).findByRole('list', { name: 'Ya no participan' });
    expect(await within(inactivos).findByText('Tomi')).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          init?.method === 'DELETE' && String(url).endsWith('/grupos/g1/miembros/u2'),
      ),
    ).toBe(true);
  });

  it('cancelar no llama a la API', async () => {
    const { fetchMock } = mockMiembros(grupoBariloche);
    abrir(grupoBariloche);
    const p = await panel();
    await userEvent.click(within(p).getByRole('button', { name: 'Quitar a Tomi' }));
    const dialogo = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  });

  it('409 SALDO_PENDIENTE → el mensaje de la API queda en el diálogo (CA-11.2)', async () => {
    const message = 'No se puede quitar: tiene saldo pendiente de $ 3.200';
    mockMiembros(grupoBariloche, {
      'DELETE /grupos/g1/miembros/u2': () =>
        error('SALDO_PENDIENTE', message, 409, { saldo: '-3200.00' }),
    });
    abrir(grupoBariloche);
    const p = await panel();
    await userEvent.click(within(p).getByRole('button', { name: 'Quitar a Tomi' }));
    const dialogo = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Quitar del grupo' }));
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(message);
    expect(within(dialogo).getByRole('button', { name: 'Quitar del grupo' })).toBeEnabled();
  });

  it('el admin no tiene botón para quitarse a sí mismo (CA-11.3)', async () => {
    mockMiembros(grupoBariloche);
    abrir(grupoBariloche);
    const p = await panel();
    expect(within(p).getByRole('button', { name: 'Quitar a Juli' })).toBeInTheDocument();
    expect(within(p).queryByRole('button', { name: 'Quitar a Sofía' })).not.toBeInTheDocument();
    // A los que ya no participan tampoco se los puede quitar
    expect(within(p).queryByRole('button', { name: 'Quitar a Caro' })).not.toBeInTheDocument();
  });
});

describe('Sin permisos', () => {
  it('un miembro común no ve los controles de agregar ni de quitar', async () => {
    mockMiembros(grupoDepto);
    abrir(grupoDepto);
    const p = await panel();
    await within(p).findByText('tomi@mail.com');
    expect(within(p).queryByLabelText('Agregar por email')).not.toBeInTheDocument();
    expect(within(p).queryByRole('button', { name: /^Quitar/ })).not.toBeInTheDocument();
  });

  it('en un grupo archivado ni el admin ve los controles', async () => {
    const archivado = { ...grupoBariloche, archivado: true };
    mockMiembros(archivado);
    abrir(archivado);
    const p = await panel();
    await within(p).findByText('tomi@mail.com');
    expect(within(p).queryByLabelText('Agregar por email')).not.toBeInTheDocument();
    expect(within(p).queryByRole('button', { name: /^Quitar/ })).not.toBeInTheDocument();
  });
});

describe('Foco', () => {
  it('al cancelar la confirmación, el foco vuelve al botón "Quitar a Tomi"', async () => {
    mockMiembros(grupoBariloche);
    abrir(grupoBariloche);
    const p = await panel();
    const boton = within(p).getByRole('button', { name: 'Quitar a Tomi' });
    await userEvent.click(boton);
    const dialogo = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(boton).toHaveFocus());
  });
});
