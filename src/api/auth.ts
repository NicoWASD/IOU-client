import { apiRequest } from './client';

export type Usuario = { id: string; nombre: string; email: string };
export type AuthResponse = { token: string; usuario: Usuario };

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiRequest<AuthResponse>('POST', '/auth/login', { body, token: null }),
  register: (body: { nombre: string; email: string; password: string }) =>
    apiRequest<AuthResponse>('POST', '/auth/register', { body, token: null }),
  me: (token: string) => apiRequest<{ usuario: Usuario }>('GET', '/auth/me', { token }),
};
