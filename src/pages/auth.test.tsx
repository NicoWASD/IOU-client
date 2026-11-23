import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/auth/tokenStore';
import { jsonResponse, mockApi, renderApp, usuarioDemo } from '@/test/utils';

beforeEach(() => tokenStore.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const ok = { token: 't-nuevo', usuario: usuarioDemo };

async function completarRegistro(password = 'secreta123') {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Sofía');
  await userEvent.type(screen.getByLabelText('Email'), 'sofi@mail.com');
  await userEvent.type(screen.getByLabelText('Contraseña'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
}

describe('Registro', () => {
  it('datos válidos → crea la cuenta y entra a Mis grupos (CA-01.1)', async () => {
    const fetchMock = mockApi({ 'POST /auth/register': () => jsonResponse(ok, 201) });
    const { router } = renderApp('/registrarme');
    await completarRegistro();
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos'));
    expect(tokenStore.get()).toBe('t-nuevo');
    const body = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body));
    expect(body).toEqual({ nombre: 'Sofía', email: 'sofi@mail.com', password: 'secreta123' });
  });

  it('email en uso → error debajo del campo email (CA-01.2)', async () => {
    mockApi({
      'POST /auth/register': () =>
        jsonResponse({ error: { code: 'EMAIL_EN_USO', message: 'El email ya está en uso' } }, 409),
    });
    renderApp('/registrarme');
    await completarRegistro();
    const email = screen.getByLabelText('Email');
    expect(await screen.findByText('El email ya está en uso')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email.getAttribute('aria-describedby')).toContain(
      screen.getByText('El email ya está en uso').id,
    );
  });

  it('contraseña corta → error en el campo sin llamar a la API (CA-01.3)', async () => {
    const fetchMock = mockApi({});
    renderApp('/registrarme');
    await completarRegistro('1234567');
    expect(
      await screen.findByText('La contraseña tiene que tener al menos 8 caracteres.'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mientras envía, el botón queda deshabilitado y dice "Creando cuenta…"', async () => {
    mockApi({ 'POST /auth/register': () => new Promise<Response>(() => {}) });
    renderApp('/registrarme');
    await completarRegistro();
    expect(await screen.findByRole('button', { name: 'Creando cuenta…' })).toBeDisabled();
  });
});

describe('Ingreso', () => {
  async function ingresar(password = 'secreta123') {
    await userEvent.type(screen.getByLabelText('Email'), 'sofi@mail.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
  }

  it('credenciales correctas → Mis grupos (CA-02.1)', async () => {
    mockApi({ 'POST /auth/login': () => jsonResponse(ok) });
    const { router } = renderApp('/ingresar');
    await ingresar();
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos'));
  });

  it('credenciales incorrectas → mensaje genérico (CA-02.2)', async () => {
    mockApi({
      'POST /auth/login': () =>
        jsonResponse(
          { error: { code: 'CREDENCIALES_INVALIDAS', message: 'Email o contraseña incorrectos' } },
          401,
        ),
    });
    renderApp('/ingresar');
    await ingresar('otra-clave');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos');
  });

  it('con ?sesion=expirada muestra el aviso (CA-03.2)', async () => {
    mockApi({});
    renderApp('/ingresar?sesion=expirada');
    expect(await screen.findByText('Tu sesión expiró. Ingresá de nuevo.')).toBeInTheDocument();
  });

  it('después de ingresar vuelve a la ruta de origen', async () => {
    mockApi({ 'POST /auth/login': () => jsonResponse(ok) });
    const { router } = renderApp('/grupos');
    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'));
    await ingresar();
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos'));
  });

  it('ya logueado, /ingresar redirige a Mis grupos', async () => {
    tokenStore.set('t-valido');
    mockApi({ 'GET /auth/me': () => jsonResponse({ usuario: usuarioDemo }) });
    const { router } = renderApp('/ingresar');
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos'));
  });
});
