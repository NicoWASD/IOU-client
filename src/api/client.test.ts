import { afterEach, describe, expect, it, vi } from 'vitest';
import { authEvents } from '@/auth/events';
import { tokenStore } from '@/auth/tokenStore';
import { ApiError, apiRequest, joinUrl } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe('joinUrl', () => {
  it.each([
    ['https://x.com/api', '/health'],
    ['https://x.com/api/', '/health'],
    ['https://x.com/api/', 'health'],
    ['https://x.com/api', 'health'],
  ])('joinUrl(%s, %s) sin doble barra', (base, path) => {
    expect(joinUrl(base, path)).toBe('https://x.com/api/health');
  });
});

describe('apiRequest', () => {
  it('manda el token como Bearer y el body como JSON', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest('POST', '/auth/login', { body: { a: 1 }, token: 't123' });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer t123');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('un 400 tira ApiError con code y details', async () => {
    const body = {
      error: { code: 'VALIDATION_ERROR', message: 'Revisá los datos', details: { email: 'mal' } },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status: 400 })),
    );
    const err = await apiRequest('POST', '/auth/register', { body: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', details: { email: 'mal' } });
  });

  it('un fallo de red tira ApiError SIN_CONEXION', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    await expect(apiRequest('GET', '/auth/me')).rejects.toMatchObject({ code: 'SIN_CONEXION' });
  });
});

describe('apiRequest: sesión', () => {
  const authDe = (fetchMock: ReturnType<typeof vi.fn>) =>
    new Headers((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers).get(
      'Authorization',
    );

  it('sin opts.token usa el token del tokenStore', async () => {
    tokenStore.set('t-guardado');
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest('GET', '/grupos');
    expect(authDe(fetchMock)).toBe('Bearer t-guardado');
  });

  it('con token: null no manda Authorization aunque haya uno guardado', async () => {
    tokenStore.set('t-guardado');
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest('POST', '/auth/login', { body: {}, token: null });
    expect(authDe(fetchMock)).toBeNull();
  });

  it('un 204 resuelve sin body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    await expect(apiRequest('DELETE', '/grupos/g1/miembros/u2')).resolves.toBeUndefined();
  });

  it.each(['TOKEN_EXPIRADO', 'TOKEN_INVALIDO'])('un 401 %s emite sesionInvalida', async (code) => {
    const listener = vi.fn();
    const off = authEvents.onSesionInvalida(listener);
    const body = { error: { code, message: 'Tu sesión expiró. Ingresá de nuevo.' } };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status: 401 })),
    );
    try {
      tokenStore.set('t-usado');
      await expect(apiRequest('GET', '/grupos')).rejects.toBeInstanceOf(ApiError);
      expect(listener).toHaveBeenCalledExactlyOnceWith('t-usado');
    } finally {
      off();
    }
  });

  it('otros errores no emiten sesionInvalida', async () => {
    const listener = vi.fn();
    const off = authEvents.onSesionInvalida(listener);
    const body = {
      error: { code: 'CREDENCIALES_INVALIDAS', message: 'Email o contraseña incorrectos' },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status: 401 })),
    );
    try {
      await expect(apiRequest('POST', '/auth/login', { body: {} })).rejects.toBeInstanceOf(
        ApiError,
      );
      expect(listener).not.toHaveBeenCalled();
    } finally {
      off();
    }
  });
});
