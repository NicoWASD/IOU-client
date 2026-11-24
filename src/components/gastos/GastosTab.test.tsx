import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/auth/tokenStore';
import { grupoBariloche } from '@/test/fixtures/h2';
import { gastoSuper, paginaGastos } from '@/test/fixtures/h3';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.set('t-valido'));
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const base = {
  'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }),
  'GET /grupos/g1': () => jsonResponse({ grupo: grupoBariloche }),
  'GET /grupos/g1/gastos': () => jsonResponse(paginaGastos),
  'GET /grupos/g1/gastos/e1': () => jsonResponse({ gasto: gastoSuper }),
};

describe('Pestaña Gastos', () => {
  it('lista por día con pagador, monto y mi parte; abre el detalle (CA-15.1, CA-16.1)', async () => {
    mockApi(base);
    renderApp('/grupos/g1');
    const fila = await screen.findByRole('button', { name: /Super/ });
    expect(fila).toHaveTextContent('Pagó Tomi');
    expect(fila).toHaveTextContent('Tu parte $ 33,34');
    expect(screen.getByRole('button', { name: /Nafta/ })).toHaveTextContent('No participás');
    await userEvent.click(fila);
    const dialogo = await screen.findByRole('dialog');
    expect(await within(dialogo).findByText('Partes iguales', { exact: false })).toBeVisible();
    expect(within(dialogo).getAllByText('$ 33,33')).toHaveLength(2);
  });

  it('el formulario muestra la diferencia en vivo y manda los montos al guardar (CA-13.2)', async () => {
    let enviado: unknown;
    mockApi({
      ...base,
      'POST /grupos/g1/gastos': (init) => {
        enviado = JSON.parse(String(init?.body));
        return jsonResponse({ gasto: gastoSuper }, 201);
      },
    });
    renderApp('/grupos/g1');
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar un gasto' }));
    const dialogo = await screen.findByRole('dialog');
    const d = within(dialogo);
    await userEvent.type(d.getByLabelText('Monto'), '100');
    await userEvent.click(d.getByRole('button', { name: 'Cena' }));
    await userEvent.click(d.getByRole('radio', { name: 'Montos' }));
    await userEvent.type(d.getByLabelText('Monto de Sofía'), '60');
    expect(d.getByRole('status')).toHaveTextContent('Faltan $ 40');
    expect(d.getByRole('button', { name: 'Guardar gasto' })).toBeDisabled();
    await userEvent.type(d.getByLabelText('Monto de Tomi'), '40');
    expect(d.getByRole('status')).toHaveTextContent('Cierra justo');
    await userEvent.click(d.getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByText('Gasto guardado')).toBeVisible();
    expect(enviado).toMatchObject({
      descripcion: 'Cena',
      monto: '100.00',
      pagadoPor: 'u1',
      tipoDivision: 'MONTOS',
      participantes: [
        { usuarioId: 'u1', monto: '60.00' },
        { usuarioId: 'u2', monto: '40.00' },
      ],
    });
  });
});
