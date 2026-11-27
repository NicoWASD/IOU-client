import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthProvider';
import { authApi, type CambiosPerfil } from './auth';
import { apiRequest } from './client';
import { grupoKeys } from './grupos';
import type { UsuarioRef } from './types';

// Rutas del H6 (api-contract.md): perfil, medios de cobro e invitaciones.

export type UsuarioBuscado = UsuarioRef & { usuario: string };
export type Plataforma = 'MERCADO_PAGO' | 'UALA' | 'BRUBANK' | 'BANCO' | 'OTRO';
export type MedioCobro = { plataforma: Plataforma; valor: string; nota: string | null };
export type Invitacion = {
  id: string;
  grupo: { id: string; nombre: string };
  invitado: UsuarioBuscado;
  invitadoPor: UsuarioRef;
  createdAt: string;
};

export const PLATAFORMAS: Record<Plataforma, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  UALA: 'Ualá',
  BRUBANK: 'Brubank',
  BANCO: 'Banco (CBU/CVU)',
  OTRO: 'Otro',
};

/** RN-21 */
export const MAX_MEDIOS = 5;

const enc = encodeURIComponent;

export const socialApi = {
  buscar: (q: string, grupoId?: string) =>
    apiRequest<{ usuarios: UsuarioBuscado[] }>(
      'GET',
      `/usuarios/buscar?q=${enc(q)}${grupoId ? `&grupoId=${enc(grupoId)}` : ''}`,
    ).then((r) => r.usuarios),
  misMedios: () => apiRequest<{ medios: MedioCobro[] }>('GET', '/me/medios').then((r) => r.medios),
  guardarMedios: (medios: MedioCobro[]) =>
    apiRequest<{ medios: MedioCobro[] }>('PUT', '/me/medios', { body: { medios } }).then(
      (r) => r.medios,
    ),
  mediosDe: (usuarioId: string) =>
    apiRequest<{ medios: MedioCobro[] }>('GET', `/usuarios/${enc(usuarioId)}/medios`).then(
      (r) => r.medios,
    ),
  mias: () =>
    apiRequest<{ invitaciones: Invitacion[] }>('GET', '/invitaciones').then((r) => r.invitaciones),
  delGrupo: (grupoId: string) =>
    apiRequest<{ invitaciones: Invitacion[] }>('GET', `/grupos/${enc(grupoId)}/invitaciones`).then(
      (r) => r.invitaciones,
    ),
  invitar: (grupoId: string, usuarioId: string) =>
    apiRequest<{ invitacion: Invitacion }>('POST', `/grupos/${enc(grupoId)}/invitaciones`, {
      body: { usuarioId },
    }).then((r) => r.invitacion),
  cancelar: (grupoId: string, id: string) =>
    apiRequest<void>('DELETE', `/grupos/${enc(grupoId)}/invitaciones/${enc(id)}`),
  aceptar: (id: string) =>
    apiRequest<{ grupoId: string }>('POST', `/invitaciones/${enc(id)}/aceptar`),
  rechazar: (id: string) => apiRequest<void>('POST', `/invitaciones/${enc(id)}/rechazar`),
};

export const socialKeys = {
  medios: ['medios', 'mios'] as const,
  mediosDe: (id: string) => ['medios', id] as const,
  mias: ['invitaciones'] as const,
  delGrupo: (grupoId: string) => [...grupoKeys.detalle(grupoId), 'invitaciones'] as const,
  buscar: (q: string, grupoId?: string) => ['buscar', q, grupoId ?? ''] as const,
};

export function useActualizarPerfil() {
  const { actualizarUsuario } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (c: CambiosPerfil) => authApi.actualizar(c),
    onSuccess: (u) => {
      actualizarUsuario(u);
      // El nombre visible cambia en todos los grupos
      void queryClient.invalidateQueries({ queryKey: grupoKeys.todos });
    },
  });
}

export const useMisMedios = () =>
  useQuery({ queryKey: socialKeys.medios, queryFn: socialApi.misMedios });

export function useGuardarMedios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: socialApi.guardarMedios,
    onSuccess: (m) => queryClient.setQueryData(socialKeys.medios, m),
  });
}

export const useMediosDe = (usuarioId: string | null) =>
  useQuery({
    queryKey: socialKeys.mediosDe(usuarioId ?? ''),
    queryFn: () => socialApi.mediosDe(usuarioId as string),
    enabled: usuarioId !== null,
  });

/** El buscador consulta desde 2 caracteres (CA-32.1); el debounce lo hace el componente. */
export const useBuscarUsuarios = (q: string, grupoId?: string) =>
  useQuery({
    queryKey: socialKeys.buscar(q, grupoId),
    queryFn: () => socialApi.buscar(q, grupoId),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useMisInvitaciones = () =>
  useQuery({ queryKey: socialKeys.mias, queryFn: socialApi.mias, refetchInterval: 60_000 });

export const useInvitacionesDelGrupo = (grupoId: string, habilitado: boolean) =>
  useQuery({
    queryKey: socialKeys.delGrupo(grupoId),
    queryFn: () => socialApi.delGrupo(grupoId),
    enabled: habilitado,
  });

export function useInvitar(grupoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId: string) => socialApi.invitar(grupoId, usuarioId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: socialKeys.delGrupo(grupoId) });
      void queryClient.invalidateQueries({ queryKey: ['buscar'] });
    },
  });
}

export function useCancelarInvitacion(grupoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialApi.cancelar(grupoId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: socialKeys.delGrupo(grupoId) }),
  });
}

export function useResponderInvitacion() {
  const queryClient = useQueryClient();
  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: socialKeys.mias });
    void queryClient.invalidateQueries({ queryKey: grupoKeys.todos });
  };
  return {
    aceptar: useMutation({ mutationFn: socialApi.aceptar, onSuccess: refrescar }),
    rechazar: useMutation({ mutationFn: socialApi.rechazar, onSuccess: refrescar }),
  };
}
