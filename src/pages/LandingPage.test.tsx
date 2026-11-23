import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { tokenStore } from '@/auth/tokenStore';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const plain = (s: string | null) => (s ?? '').replace(/\s/g, ' ');

it('muestra el título y la acción principal (CA-30.1)', async () => {
  mockApi({});
  renderApp('/');
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Cuentas claras entre amigos.' }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Crear un grupo gratis' })[0]).toHaveAttribute(
    'href',
    '/registrarme',
  );
});

it('la demo recalcula los vales al cambiar la cantidad de personas (CA-30.2)', async () => {
  mockApi({});
  renderApp('/');
  const demo = await screen.findByRole('region', { name: 'Probá cómo se reparte un gasto' });
  const vales = () => within(demo).getAllByTestId('vale');

  expect(vales()).toHaveLength(3);
  vales().forEach((v) => expect(plain(v.textContent)).toContain('$ 9.000'));

  await userEvent.click(within(demo).getByRole('button', { name: 'Una persona menos' }));
  expect(vales()).toHaveLength(2);
  vales().forEach((v) => expect(plain(v.textContent)).toContain('$ 12.000'));
});

it('la demo usa el reparto con redondeo de la spec', async () => {
  mockApi({});
  renderApp('/');
  const demo = await screen.findByRole('region', { name: 'Probá cómo se reparte un gasto' });
  const monto = within(demo).getByLabelText('Sofi pagó la cena');
  await userEvent.clear(monto);
  await userEvent.type(monto, '100');
  await userEvent.click(within(demo).getByRole('button', { name: 'Una persona menos' }));
  // $100 entre 3: Sofi pone 33,34 y los otros dos le deben 33,33
  const vales = within(demo).getAllByTestId('vale');
  expect(vales).toHaveLength(2);
  vales.forEach((v) => expect(plain(v.textContent)).toContain('$ 33,33'));
});

it('con sesión activa la acción principal es "Ir a mis grupos" (CA-30.3)', async () => {
  tokenStore.set('t-valido');
  mockApi({ 'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }) });
  renderApp('/');
  await waitFor(() =>
    expect(screen.getAllByRole('link', { name: 'Ir a mis grupos' })[0]).toHaveAttribute(
      'href',
      '/grupos',
    ),
  );
  expect(screen.queryByRole('link', { name: 'Crear un grupo gratis' })).not.toBeInTheDocument();
});
