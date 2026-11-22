import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HealthStatus } from './HealthStatus';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function renderWithQuery() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

it('muestra "Despertando el servidor…" mientras espera', () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  renderWithQuery();
  expect(screen.getByText('Despertando el servidor…')).toBeInTheDocument();
});

it('muestra "API: ok · DB: ok"', async () => {
  fetchMock.mockResolvedValue(json({ status: 'ok', db: 'ok' }, 200));
  renderWithQuery();
  expect(await screen.findByText('API: ok · DB: ok')).toBeInTheDocument();
});

it('muestra "API: ok · DB: sin conexión" ante 503', async () => {
  fetchMock.mockResolvedValue(json({ status: 'error', db: 'error' }, 503));
  renderWithQuery();
  expect(await screen.findByText('API: ok · DB: sin conexión')).toBeInTheDocument();
});

it('muestra "API: sin conexión" si fetch falla', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
  renderWithQuery();
  expect(await screen.findByText('API: sin conexión')).toBeInTheDocument();
});
