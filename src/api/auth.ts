import { apiRequest } from './client';

/** Perfil (contrato H6). `nombre` es el nombre visible: «nombreReal apellido» o el usuario. */
export type Usuario = {
  id: string;
  nombre: string;
  usuario: string;
  email: string;
  nombreReal: string | null;
  apellido: string | null;
  tutorialVisto: boolean;
};
export type AuthResponse = { token: string; usuario: Usuario };
export type CambiosPerfil = {
  usuario?: string;
  nombre?: string | null;
  apellido?: string | null;
  tutorialVisto?: boolean;
};

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiRequest<AuthResponse>('POST', '/auth/login', { body, token: null }),
  register: (body: { usuario: string; email: string; password: string }) =>
    apiRequest<AuthResponse>('POST', '/auth/register', { body, token: null }),
  me: (token: string) => apiRequest<{ usuario: Usuario }>('GET', '/auth/me', { token }),
  actualizar: (body: CambiosPerfil) =>
    apiRequest<{ usuario: Usuario }>('PATCH', '/auth/me', { body }).then((r) => r.usuario),
};
